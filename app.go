package main

import (
	"chat-app/src/server"
	"chat-app/src/server/config"
	"chat-app/src/server/controllers"
	"chat-app/src/server/db"
	"context"
	"embed"
	"fmt"
	"io/fs"
	"net/http"
)

//go:embed all:dist
var assets embed.FS

var version = "dev" // Set by the build system

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

	fmt.Println("Server version:", version)

	// If the server is set to autoload, start it
	appConfig := config.GetConfig()
	if appConfig.AutoLoad && appConfig.LastModel != "" {
		lastModel := appConfig.LastModel
		fmt.Println("Auto loading model:", lastModel)
		_, err := controllers.StartServer(ctx, &controllers.StartServerInput{
			Body: struct {
				ModelFile   string `json:"modelFile"`
				ContextSize int    `json:"contextSize"`
			}{
				ModelFile:   lastModel,
				ContextSize: appConfig.ContextSize,
			},
		})
		if err != nil {
			fmt.Println("Error starting server:", err)
		}
	}

	db.InitDB()

	router := server.InitRouter()

	// Serve the static files as a web app
	subFS, err := fs.Sub(assets, "dist")
	if err != nil {
		fmt.Println("Error getting sub fs:", err)
	}
	fs := http.FileServer(http.FS(subFS))
	router.Handle("/*", http.StripPrefix("/", fs))

	http.ListenAndServe(":31700", router)
}

func (app *App) shutdown(ctx context.Context) {
	fmt.Println("Shutting down")
	_, err := controllers.StopServer(ctx, &struct{}{})
	if err != nil {
		fmt.Println("Error stopping server:", err)
	}
}
