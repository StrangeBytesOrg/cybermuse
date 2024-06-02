package main

import (
	"chat-app/src/server"
	"chat-app/src/server/config"
	"chat-app/src/server/controllers"
	"chat-app/src/server/db"
	"context"
	"fmt"
	"net/http"
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
