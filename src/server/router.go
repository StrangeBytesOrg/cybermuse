package server

import (
	"chat-app/src/server/controllers"
	"os"
	"path"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/danielgtaylor/huma/v2/sse"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
)

func InitRouter() *chi.Mux {
	router := chi.NewRouter()
	router.Use(cors.Handler(
		cors.Options{},
	))

	apiRouter := chi.NewRouter()
	router.Mount("/api", apiRouter)
	humaConfig := huma.DefaultConfig("Chat App", "0.0.1")
	humaConfig.Servers = []*huma.Server{
		{URL: "/api"},
	}
	api := humachi.New(apiRouter, humaConfig)

	// Characters
	huma.Register(api, huma.Operation{
		Path:        "/characters",
		Method:      "GET",
		Tags:        []string{"characters"},
		OperationID: "GetAllCharacters",
	}, controllers.GetAllCharacters)

	huma.Register(api, huma.Operation{
		Path:        "/character/{id}",
		Method:      "GET",
		Tags:        []string{"characters"},
		OperationID: "GetCharacter",
	}, controllers.GetCharacter)

	huma.Register(api, huma.Operation{
		Path:         "/create-character",
		Method:       "POST",
		Tags:         []string{"characters"},
		OperationID:  "CreateCharacter",
		MaxBodyBytes: 50 * 1024 * 1024, // 50 MB
	}, controllers.CreateCharacter)

	huma.Register(api, huma.Operation{
		Path:        "/update-character/{id}",
		Method:      "POST",
		Tags:        []string{"characters"},
		OperationID: "UpdateCharacter",
	}, controllers.UpdateCharacter)

	huma.Register(api, huma.Operation{
		Path:        "/delete-character/{id}",
		Method:      "POST",
		Tags:        []string{"characters"},
		OperationID: "DeleteCharacter",
	}, controllers.DeleteCharacter)

	// Chats
	huma.Register(api, huma.Operation{
		Path:        "/chats",
		Method:      "GET",
		Tags:        []string{"chats"},
		OperationID: "GetAllChats",
	}, controllers.GetAllChats)

	huma.Register(api, huma.Operation{
		Path:        "/create-chat",
		Method:      "POST",
		Tags:        []string{"chats"},
		OperationID: "CreateChat",
	}, controllers.CreateChat)

	huma.Register(api, huma.Operation{
		Path:        "/delete-chat/{id}",
		Method:      "POST",
		Tags:        []string{"chats"},
		OperationID: "DeleteChat",
	}, controllers.DeleteChat)

	huma.Register(api, huma.Operation{
		Path:        "/chat/{id}",
		Method:      "GET",
		Tags:        []string{"chats"},
		OperationID: "GetChat",
	}, controllers.GetChat)

	// Messages
	huma.Register(api, huma.Operation{
		Path:        "/create-message",
		Method:      "POST",
		Tags:        []string{"messages"},
		OperationID: "CreateMessage",
	}, controllers.CreateMessage)

	huma.Register(api, huma.Operation{
		Path:        "/update-message/{id}",
		Method:      "POST",
		Tags:        []string{"messages"},
		OperationID: "UpdateMessage",
	}, controllers.UpdateMessage)

	huma.Register(api, huma.Operation{
		Path:        "/delete-message/{id}",
		Method:      "POST",
		Tags:        []string{"messages"},
		OperationID: "DeleteMessage",
	}, controllers.DeleteMessage)

	huma.Register(api, huma.Operation{
		Path:        "/get-response-character/{chatId}",
		Method:      "POST",
		Tags:        []string{"messages"},
		OperationID: "GetResponseCharacter",
	}, controllers.GetResponseCharacter)

	// Swipes
	huma.Register(api, huma.Operation{
		Path:        "/new-swipe/{messageId}",
		Method:      "POST",
		Tags:        []string{"swipes"},
		OperationID: "NewSwipe",
	}, controllers.NewSwipe)

	huma.Register(api, huma.Operation{
		Path:        "/swipe-left/{messageId}",
		Method:      "POST",
		Tags:        []string{"swipes"},
		OperationID: "SwipeLeft",
	}, controllers.SwipeLeft)

	huma.Register(api, huma.Operation{
		Path:        "/swipe-right/{messageId}",
		Method:      "POST",
		Tags:        []string{"swipes"},
		OperationID: "SwipeRight",
	}, controllers.SwipeRight)

	// Built in server
	huma.Register(api, huma.Operation{
		Path:        "/start-server",
		Method:      "POST",
		Tags:        []string{"server"},
		OperationID: "StartServer",
	}, controllers.StartServer)

	huma.Register(api, huma.Operation{
		Path:        "/stop-server",
		Method:      "POST",
		Tags:        []string{"server"},
		OperationID: "StopServer",
	}, controllers.StopServer)

	huma.Register(api, huma.Operation{
		Path:        "/status",
		Method:      "GET",
		Tags:        []string{"server"},
		OperationID: "GetStatus",
	}, controllers.GetServerStatus)

	// Models
	huma.Register(api, huma.Operation{
		Path:        "/models",
		Method:      "GET",
		Tags:        []string{"server"},
		OperationID: "ListModels",
	}, controllers.ListModels)

	huma.Register(api, huma.Operation{
		Path:        "/set-model-path",
		Method:      "POST",
		Tags:        []string{"server"},
		OperationID: "SetModelPath",
	}, controllers.SetModelPath)

	huma.Register(api, huma.Operation{
		Path:        "/set-autoload",
		Method:      "POST",
		Tags:        []string{"server"},
		OperationID: "SetAutoLoad",
	}, controllers.SetAutoLoad)

	huma.Register(api, huma.Operation{
		Path:        "/set-use-gpu",
		Method:      "POST",
		Tags:        []string{"server"},
		OperationID: "SetGPU",
	}, controllers.SetUseGPU)

	sse.Register(api, huma.Operation{
		Path:        "/download-model",
		Method:      "POST",
		Tags:        []string{"server"},
		OperationID: "DownloadModel",
	}, map[string]any{
		"progress": controllers.DownloadModelProgress{},
		"final":    controllers.DownloadModelFinal{},
		"error":    controllers.DownloadModelError{},
	}, controllers.DownloadModel)

	// Templates
	huma.Register(api, huma.Operation{
		Path:        "/templates",
		Method:      "GET",
		Tags:        []string{"templates"},
		OperationID: "GetAllTemplates",
	}, controllers.GetAllTemplates)

	huma.Register(api, huma.Operation{
		Path:        "/template/{id}",
		Method:      "GET",
		Tags:        []string{"templates"},
		OperationID: "GetTemplate",
	}, controllers.GetTemplate)

	huma.Register(api, huma.Operation{
		Path:        "/create-template",
		Method:      "POST",
		Tags:        []string{"templates"},
		OperationID: "CreateTemplate",
	}, controllers.CreateTemplate)

	huma.Register(api, huma.Operation{
		Path:        "/update-template/{id}",
		Method:      "POST",
		Tags:        []string{"templates"},
		OperationID: "UpdateTemplate",
	}, controllers.UpdateTemplate)

	huma.Register(api, huma.Operation{
		Path:        "/delete-template/{id}",
		Method:      "POST",
		Tags:        []string{"templates"},
		OperationID: "DeleteTemplate",
	}, controllers.DeleteTemplate)

	huma.Register(api, huma.Operation{
		Path:        "/set-active-template/{id}",
		Method:      "POST",
		Tags:        []string{"templates"},
		OperationID: "SetActive",
	}, controllers.SetActive)

	huma.Register(api, huma.Operation{
		Path:        "/parse-template",
		Method:      "POST",
		Tags:        []string{"templates"},
		OperationID: "ParseTemplate",
	}, controllers.ParseTemplate)

	// Generate Presets
	huma.Register(api, huma.Operation{
		Path:        "/presets",
		Method:      "GET",
		Tags:        []string{"presets"},
		OperationID: "GetAllPresets",
	}, controllers.GetAllPresets)

	huma.Register(api, huma.Operation{
		Path:        "/preset/{id}",
		Method:      "GET",
		Tags:        []string{"presets"},
		OperationID: "GetPreset",
	}, controllers.GetPreset)

	huma.Register(api, huma.Operation{
		Path:        "/create-preset",
		Method:      "POST",
		Tags:        []string{"presets"},
		OperationID: "CreatePreset",
	}, controllers.CreatePreset)

	huma.Register(api, huma.Operation{
		Path:        "/update-preset/{id}",
		Method:      "POST",
		Tags:        []string{"presets"},
		OperationID: "UpdatePreset",
	}, controllers.UpdatePreset)

	huma.Register(api, huma.Operation{
		Path:        "/delete-preset/{id}",
		Method:      "POST",
		Tags:        []string{"presets"},
		OperationID: "DeletePreset",
	}, controllers.DeletePreset)

	huma.Register(api, huma.Operation{
		Path:        "/set-active-preset/{id}",
		Method:      "POST",
		Tags:        []string{"presets"},
		OperationID: "SetActivePreset",
	}, controllers.SetActivePreset)

	// Generation
	sse.Register(api, huma.Operation{
		Path:        "/generate",
		Method:      "POST",
		Tags:        []string{"generation"},
		OperationID: "Generate",
	}, map[string]any{
		"text":  controllers.GenerateTextResponse{},
		"error": controllers.ErrorResponse{},
	}, controllers.Generate)

	sse.Register(api, huma.Operation{
		Path:        "/generate-message",
		Method:      "POST",
		Tags:        []string{"messages"},
		OperationID: "GenerateMessage",
	}, map[string]any{
		"text":  controllers.GenerateMessageResponse{},
		"final": controllers.GenerateMessageFinalResponse{},
		"error": controllers.GenerateMessageErrorResponse{},
	}, controllers.GenerateMessage)

	// Write the OpenAPI spec to a file
	if os.Getenv("DEV") != "" {
		openapiSpec, _ := api.OpenAPI().YAML()
		os.WriteFile(path.Join("src", "openapi.yml"), openapiSpec, 0644)
	}

	return router
}
