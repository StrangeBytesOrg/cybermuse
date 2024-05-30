package config

import (
	"encoding/json"
	"os"
	"path"
)

type Config struct {
	AppDataPath string
	ModelsPath  string
	AutoLoad    bool
	LastModel   string
	UseGPU      bool
}

var config *Config

func GetDataPath() string {
	userConfigDir, err := os.UserConfigDir()
	if err != nil {
		panic(err)
	}
	appDataPath := path.Join(userConfigDir, "chat-app")
	return appDataPath
}

func LoadConfigFromFile(filePath string) (*Config, error) {
	var cfg *Config
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(data, &cfg)
	if err != nil {
		return nil, err
	}
	return cfg, nil
}

func SaveConfigToFile(cfg *Config) error {
	appDataPath := GetDataPath()
	filePath := path.Join(appDataPath, "config.json")
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, data, 0644)
}

// TODO It's a bit confusing that defaults are written in the GetConfig function, maybe refactor to be more obvious
func GetConfig() *Config {
	appDataPath := GetDataPath()
	configFilePath := path.Join(appDataPath, "config.json")

	// Check if the config file exists
	if _, err := os.Stat(configFilePath); os.IsNotExist(err) {
		// Create a default config file
		defaultModelsPath := path.Join(appDataPath, "models")
		config = &Config{
			ModelsPath:  defaultModelsPath,
			AppDataPath: appDataPath,
			AutoLoad:    false,
			UseGPU:      false,
		}
		err := SaveConfigToFile(config)
		if err != nil {
			panic(err)
		}
	} else {
		// Load the config file
		var err error
		config, err = LoadConfigFromFile(configFilePath)
		if err != nil {
			panic(err)
		}
	}

	return config
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
