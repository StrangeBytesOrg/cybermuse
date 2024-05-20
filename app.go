package main

import (
	"chat-app/src/server"
	"chat-app/src/server/config"
	"chat-app/src/server/controllers"
	"chat-app/src/server/db"
	"context"
	_ "embed"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved so we can call the runtime methods
func (app *App) startup(ctx context.Context) {
	app.ctx = ctx

	config.Init()
	installServer()

	// If the server is set to autoload, start it
	if config.GetConfig().AutoLoad && config.GetConfig().LastModel != "" {
		lastModel := config.GetConfig().LastModel
		fmt.Println("Auto loading model:", lastModel)
		_, err := controllers.StartServer(ctx, &controllers.StartServerInput{
			Body: struct {
				ModelFile string `json:"modelFile"`
			}{
				ModelFile: lastModel,
			},
		})
		if err != nil {
			fmt.Println("Error starting server:", err)
		}
	}

	db.InitDB()
	router := server.InitRouter()
	http.ListenAndServe(":31700", router)
}

func (app *App) shutdown(ctx context.Context) {
	fmt.Println("Shutting down")
	_, err := controllers.StopServer(ctx, &struct{}{})
	if err != nil {
		fmt.Println("Error stopping server:", err)
	}
}

//go:embed llama-server
var embeddedServer []byte

// Extract the LlamaCPP server into the app data directory
func installServer() {
	appDataDir, err := os.UserConfigDir()
	if err != nil {
		fmt.Println("Error getting app data dir: ", err)
		return
	}

	// Check if the llama-server binary already exists
	binaryPath := filepath.Join(appDataDir, "chat-app", "llama-server")
	if _, err := os.Stat(binaryPath); err == nil {
		println("Llama server already exists")
		return
	}

	configDir := filepath.Join(appDataDir, "chat-app")
	err = os.MkdirAll(configDir, 0755)
	if err != nil {
		fmt.Println("Error creating llama dir: ", err)
		return
	}

	println("Extracting LlamaCPP to: ", binaryPath)
	os.WriteFile(binaryPath, embeddedServer, 0755)
}
