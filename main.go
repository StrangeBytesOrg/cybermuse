package main

import (
	"context"
	"embed"
	"flag"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

// App holds application state for Wails bindings / lifecycle.
type App struct {
	ctx context.Context
}

// startup is called by Wails when the app starts. Save the context for later use.
func (a *App) startup(ctx context.Context) { a.ctx = ctx }

//go:embed all:dist
var assets embed.FS

func main() {
	// Command-line flags to control debug behaviour.
	debugFlag := flag.Bool("debug", false, "Open the Wails inspector (devtools) on startup")
	debugShortFlag := flag.Bool("d", false, "Alias for --debug")
	flag.Parse()
	openInspector := *debugFlag || *debugShortFlag

	// Create an instance of the app structure
	app := &App{}

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "Cybermuse Desktop",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Debug: options.Debug{
			OpenInspectorOnStartup: openInspector,
		},
		// Bind: []interface{}{
		// 	app,
		// },
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
