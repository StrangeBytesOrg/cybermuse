package controllers

import (
	"bufio"
	"chat-app/src/server/config"
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/sse"
)

// List all models in the model folder
type ListModelsResponse struct {
	Body struct {
		ModelPath string  `json:"modelPath"`
		Models    []Model `json:"models"`
	}
}

type Model struct {
	Name string `json:"name"`
	Size int64  `json:"size"`
}

func ListModels(ctx context.Context, input *struct{}) (*ListModelsResponse, error) {
	config := config.GetConfig()

	files, err := os.ReadDir(config.ModelsPath)
	if err != nil {
		fmt.Println("Error reading model directory:", err)
		return nil, huma.Error500InternalServerError("Error reading model directory")
	}
	models := []Model{} // Updated to hold Model objects instead of strings
	for _, file := range files {
		if file.IsDir() {
			continue
		}
		if filepath.Ext(file.Name()) == ".gguf" {
			modelPath := filepath.Join(config.ModelsPath, file.Name())
			fileInfo, err := os.Stat(modelPath)
			if err != nil {
				return nil, err
			}
			model := Model{
				Name: file.Name(),
				Size: fileInfo.Size(),
			}
			models = append(models, model)
		}
	}
	response := &ListModelsResponse{}
	response.Body.Models = models
	response.Body.ModelPath = config.ModelsPath
	return response, nil
}

// Download a model from Hugging Face
type DownloadModelProgress struct {
	Progress float64 `json:"progress"`
}

type DownloadModelFinal struct{}

type DownloadModelError struct {
	Error string `json:"error"`
}

func DownloadModel(ctx context.Context, input *struct {
	Body struct {
		RepoId string `json:"repoId"`
		Path   string `json:"path"`
	}
}, send sse.Sender) {
	appConfig := config.GetConfig()
	url := fmt.Sprintf("https://huggingface.co/%s/resolve/main/%s", input.Body.RepoId, input.Body.Path)
	fmt.Println("Downloading model from:", url)

	// Check if the model already exists with a HEAD request
	headResponse, err := http.DefaultClient.Head(url)
	if err != nil || headResponse.StatusCode != 200 {
		fmt.Println("Model check failed:", err, headResponse.StatusCode)
		send.Data(&DownloadModelError{Error: "Model not found"})
		return
	}

	response, err := http.DefaultClient.Get(url)
	if err != nil || response.StatusCode != 200 {
		fmt.Println("Failed to download model:", err)
		send.Data(&DownloadModelError{Error: "Failed to download model"})
		return
	}
	defer response.Body.Close()

	contentLength, err := strconv.ParseInt(response.Header.Get("Content-Length"), 10, 64)
	if err != nil {
		send.Data(&DownloadModelError{Error: "Failed to download model"})
		return
	}
	fmt.Println("Downloading model of size:", float64(contentLength)/(1024*1024))

	finalPath := filepath.Join(appConfig.ModelsPath, input.Body.Path)
	file, err := os.Create(finalPath)
	if err != nil {
		send.Data(&DownloadModelError{Error: "Failed to download model"})
		return
	}
	defer file.Close()

	reader := bufio.NewReader(response.Body)
	writer := bufio.NewWriter(file)
	receivedLength := int64(0)

	for {
		buffer := make([]byte, 1024*1024)
		n, err := reader.Read(buffer)
		if err != nil && err != io.EOF {
			send.Data(&DownloadModelError{Error: "Failed to download model"})
			return
		}
		if n == 0 {
			break
		}
		_, err = writer.Write(buffer[:n])
		if err != nil {
			send.Data(&DownloadModelError{Error: "Failed to download model"})
			return
		}
		receivedLength += int64(n)
		progress := float64(receivedLength) / float64(contentLength) * 100
		fmt.Printf("Downloaded %.2f%%\n", progress)
		send.Data(&DownloadModelProgress{Progress: progress})
	}
	send.Data(&DownloadModelFinal{})
}
