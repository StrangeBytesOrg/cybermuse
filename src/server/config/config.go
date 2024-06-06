package config

import (
	"encoding/json"
	"os"
	"path"
)

type Config struct {
	ModelsPath string `json:"modelsPath"`
	AutoLoad   bool   `json:"autoLoad"`
	LastModel  string `json:"lastModel"`
	UseGPU     bool   `json:"useGPU"`
}

func GetDataPath() string {
	userConfigDir, err := os.UserConfigDir()
	if err != nil {
		panic(err)
	}
	appDataPath := path.Join(userConfigDir, "chat-app")
	return appDataPath
}

func GetConfig() *Config {
	appDataPath := GetDataPath()
	configPath := path.Join(appDataPath, "config.json")
	var config *Config

	// Check if the config file exists
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		// If not, create a default config file
		defaultModelsPath := path.Join(appDataPath, "models")
		config = &Config{
			ModelsPath: defaultModelsPath,
			AutoLoad:   false,
			UseGPU:     false,
		}
	} else {
		// Load the config file
		rawData, err := os.ReadFile(configPath)
		if err != nil {
			panic(err)
		}
		err = json.Unmarshal(rawData, &config)
		if err != nil {
			panic(err)
		}
	}
	return config
}

func SaveConfig(cfg *Config) error {
	appDataPath := GetDataPath()
	filePath := path.Join(appDataPath, "config.json")
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, data, 0644)
}

func Init() {
	appDataPath := GetDataPath()

	// Create config directory if it doesn't exist
	if _, err := os.Stat(appDataPath); os.IsNotExist(err) {
		err := os.Mkdir(appDataPath, 0755)
		if err != nil {
			panic(err)
		}
	}

	// Create a models directory if it doesn't exist
	if _, err := os.Stat(path.Join(appDataPath, "models")); os.IsNotExist(err) {
		err := os.Mkdir(path.Join(appDataPath, "models"), 0755)
		if err != nil {
			panic(err)
		}
	}
}
