package controllers

import (
	"bufio"
	"chat-app/src/server/config"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/danielgtaylor/huma/v2"
)

type ServerStatus struct {
	Loaded       bool   `json:"loaded"`
	CurrentModel string `json:"currentModel"`
}

var serverStatus ServerStatus
var serverProcess *os.Process

// Server status and settings
type ServerStatusResponse struct {
	Body struct {
		Loaded       bool   `json:"loaded"`
		CurrentModel string `json:"currentModel"`
		ModelPath    string `json:"modelPath"`
		AutoLoad     bool   `json:"autoLoad"`
	}
}

func GetServerStatus(ctx context.Context, input *struct{}) (*ServerStatusResponse, error) {
	response := &ServerStatusResponse{}
	appConfig := config.GetConfig()
	response.Body.Loaded = serverStatus.Loaded
	response.Body.CurrentModel = serverStatus.CurrentModel
	response.Body.ModelPath = appConfig.ModelsPath
	response.Body.AutoLoad = appConfig.AutoLoad
	fmt.Println("Server status:", response.Body)
	return response, nil
}

type StartServerInput struct {
	Body struct {
		ModelFile string `json:"modelFile"`
	}
}

// TODO probably return some details to the client
func StartServer(ctx context.Context, input *StartServerInput) (*struct{}, error) {
	appConfig := config.GetConfig()
	binaryPath := filepath.Join(appConfig.AppDataPath, "llama-server")
	modelPath := filepath.Join(appConfig.ModelsPath, input.Body.ModelFile)

	// Check if the model file exists
	if _, err := os.Stat(modelPath); os.IsNotExist(err) {
		fmt.Println("Model file does not exist:", modelPath)
		return nil, huma.Error400BadRequest("Model file does not exist")
	}

	// Stop the server if it is already running
	if serverProcess != nil {
		fmt.Println("Killing existing server")
		serverProcess.Kill()
		_, err := serverProcess.Wait()
		if err != nil {
			fmt.Println("Error waiting for server to stop:", err)
		}
	}

	cmd := exec.Command(binaryPath, "--model", modelPath, "--log-disable")

	// Capture the stdout and stderr of the process
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		fmt.Println("Error capturing stdout:", err)
		return nil, err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		fmt.Println("Error capturing stderr:", err)
		return nil, err
	}

	err = cmd.Start()
	if err != nil {
		fmt.Println("Error starting embedded binary:", err)
		return nil, err
	}
	serverProcess = cmd.Process

	// Create scanners to read the output
	stdoutScanner := bufio.NewScanner(stdout)
	stderrScanner := bufio.NewScanner(stderr)

	// Create a channel to wait for the process to be ready
	ready := make(chan bool)
	serverError := make(chan bool)

	// Start goroutine to log stdout and save to file
	go func() {
		for stdoutScanner.Scan() {
			line := stdoutScanner.Text()
			if os.Getenv("DEV") != "" {
				fmt.Println("stdout:", line)
			}
			if strings.Contains(line, "HTTP server listening") {
				ready <- true
			}
			if strings.Contains(line, "unable to load model") {
				serverError <- true
			}
			// Log the output to the appConfig folder for debugging
			logPath := filepath.Join(appConfig.AppDataPath, "llama-server.log")
			logFile, err := os.OpenFile(logPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
			if err != nil {
				fmt.Println("Error opening log file:", err)
			} else {
				defer logFile.Close()
				logFile.WriteString(line + "\n")
			}
		}
	}()

	// Start goroutine to log stderr
	go func() {
		for stderrScanner.Scan() {
			line := stderrScanner.Text()
			if os.Getenv("DEV") != "" {
				fmt.Println("stderr:", line)
			}
		}
	}()

	select {
	case <-ready:
		fmt.Println("server is ready")
	case <-serverError:
		return nil, huma.Error500InternalServerError("Unable to load model")
	}

	serverStatus.Loaded = true
	serverStatus.CurrentModel = input.Body.ModelFile
	appConfig.LastModel = input.Body.ModelFile
	err = config.SaveConfigToFile(appConfig)
	if err != nil {
		return nil, err
	}

	return nil, nil
}

// Stop Server
func StopServer(ctx context.Context, input *struct{}) (*struct{}, error) {
	if serverProcess != nil {
		serverProcess.Kill()
		_, err := serverProcess.Wait()
		if err != nil {
			fmt.Println("Error waiting for server to stop:", err)
			return nil, huma.Error500InternalServerError("Error stopping generation server: " + err.Error())
		}
		serverProcess = nil
		serverStatus.Loaded = false
		serverStatus.CurrentModel = ""
	}
	return nil, nil
}
