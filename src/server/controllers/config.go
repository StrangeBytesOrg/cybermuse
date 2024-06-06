package controllers

import (
	"chat-app/src/server/config"
	"context"
	"fmt"
	"os"

	"github.com/danielgtaylor/huma/v2"
)

// Update the model path
func SetModelPath(ctx context.Context, input *struct {
	Body struct {
		ModelPath string `json:"modelPath"`
	}
}) (*struct{}, error) {
	if _, err := os.Stat(input.Body.ModelPath); os.IsNotExist(err) {
		fmt.Println("Model path does not exist:", input.Body.ModelPath)
		return nil, huma.Error400BadRequest("Model path does not exist")
	}
	// Check if the path has write permissions
	file, err := os.CreateTemp(input.Body.ModelPath, "test")
	if err != nil {
		fmt.Println("Model path is not writable:", input.Body.ModelPath)
		return nil, huma.Error400BadRequest("Model path is not writable")
	}
	defer os.Remove(file.Name())
	defer file.Close()

	appConfig := config.GetConfig()
	appConfig.ModelsPath = input.Body.ModelPath
	err = config.SaveConfig(appConfig)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

// Set the auto-load setting
func SetAutoLoad(ctx context.Context, input *struct {
	Body struct {
		AutoLoad bool `json:"autoLoad"`
	}
}) (*struct{}, error) {
	appConfig := config.GetConfig()
	appConfig.AutoLoad = input.Body.AutoLoad
	err := config.SaveConfig(appConfig)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

// Set the GPU setting
func SetUseGPU(ctx context.Context, input *struct {
	Body struct {
		UseGPU bool `json:"useGPU"`
	}
}) (*struct{}, error) {
	appConfig := config.GetConfig()
	appConfig.UseGPU = input.Body.UseGPU
	err := config.SaveConfig(appConfig)
	if err != nil {
		return nil, err
	}
	return nil, nil
}
