package main

import (
	"chat-app/src/server"
	"chat-app/src/server/config"
	"chat-app/src/server/controllers"
	"chat-app/src/server/db"
	"context"
	"embed"
	"fmt"
	"io"
	"io/fs"
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

//go:embed build/llamacpp
var embeddedServer embed.FS

// Extract the LlamaCPP server into the app data directory
func installServer() {
	appDataDir, err := os.UserConfigDir()
	if err != nil {
		fmt.Println("Error getting app data dir: ", err)
		return
	}

	configDir := filepath.Join(appDataDir, "chat-app")
	err = os.MkdirAll(configDir, 0755)
	if err != nil {
		fmt.Println("Error creating llama dir: ", err)
		return
	}

	serverDir := filepath.Join(configDir, "llamacpp")
	err = os.MkdirAll(serverDir, 0755)
	if err != nil {
		fmt.Println("Error creating server dir: ", err)
		return
	}

	err = fs.WalkDir(embeddedServer, "build", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		src, err := embeddedServer.Open(path)
		if err != nil {
			return err
		}
		defer src.Close()

		dst := filepath.Join(serverDir, filepath.Base(path))

		if _, err := os.Stat(dst); err == nil {
			fmt.Printf("File %s already exists, skipping\n", dst)
			return nil
		}

		srcBytes, err := io.ReadAll(src)
		if err != nil {
			return err
		}

		// Make the server executable
		if path == "build/llamacpp/server" {
			os.WriteFile(dst, srcBytes, 0755)
		} else {
			os.WriteFile(dst, srcBytes, 0644)
		}

		fmt.Printf("Extracted %s to %s\n", path, dst)
		return nil
	})
	if err != nil {
		fmt.Println("Error extracting files: ", err)
		return
	}
}
