package controllers

import (
	db "chat-app/src/server/db"
	"context"

	"github.com/danielgtaylor/huma/v2"
)

type GetAllPresetsResponse struct {
	Body struct {
		Presets []db.GeneratePreset `json:"presets"`
	}
}

func GetAllPresets(ctx context.Context, input *struct{}) (*GetAllPresetsResponse, error) {
	presets := &[]db.GeneratePreset{}
	err := db.DB.NewSelect().Model(presets).Scan(ctx)
	if err != nil {
		return nil, err
	}
	response := &GetAllPresetsResponse{}
	response.Body.Presets = *presets
	return response, nil
}

type GetPresetResponse struct {
	Body struct {
		Preset db.GeneratePreset `json:"preset"`
	}
}

func GetPreset(ctx context.Context, input *struct {
	Id string `path:"id"`
}) (*GetPresetResponse, error) {
	preset := &db.GeneratePreset{}
	err := db.DB.NewSelect().Model(preset).Where("id = ?", input.Id).Scan(ctx)
	if err != nil {
		return nil, err
	}
	response := &GetPresetResponse{}
	response.Body.Preset = *preset
	return response, nil
}

type CreatePresetResponse struct {
	Body struct {
		Id uint32 `json:"id"`
	}
}

func CreatePreset(ctx context.Context, input *struct {
	Body struct {
		Name        string  `json:"name" minLength:"1"`
		Temperature float32 `json:"temperature"`
	}
}) (*CreatePresetResponse, error) {
	preset := &db.GeneratePreset{
		Name:        input.Body.Name,
		Temperature: input.Body.Temperature,
	}
	_, err := db.DB.NewInsert().Model(preset).Exec(ctx)
	if err != nil {
		return nil, err
	}
	response := &CreatePresetResponse{}
	response.Body.Id = preset.Id
	return response, nil
}

func UpdatePreset(ctx context.Context, input *struct {
	Id   string `path:"id"`
	Body struct {
		Name        string  `json:"name"`
		Temperature float32 `json:"temperature"`
		MaxTokens   int     `json:"maxTokens"`
	}
}) (*struct{}, error) {
	_, err := db.DB.NewUpdate().
		Model(&db.GeneratePreset{}).
		Set("name = ?", input.Body.Name).
		Set("temperature = ?", input.Body.Temperature).
		Where("id = ?", input.Id).
		Exec(ctx)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

func DeletePreset(ctx context.Context, input *struct {
	Id string `path:"id"`
}) (*struct{}, error) {
	if input.Id == "1" {
		return nil, huma.Error400BadRequest("Cannot delete the default preset")
	}

	_, err := db.DB.NewDelete().Model(&db.GeneratePreset{}).Where("id = ?", input.Id).Exec(ctx)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

func SetActivePreset(ctx context.Context, input *struct {
	Id string `path:"id"`
}) (*struct{}, error) {
	// Set all presets to inactive
	_, err := db.DB.NewUpdate().Model(&db.GeneratePreset{}).Set("active = false").Where("active = true").Exec(ctx)
	if err != nil {
		return nil, err
	}

	_, err = db.DB.NewUpdate().Model(&db.GeneratePreset{}).Set("active = true").Where("id = ?", input.Id).Exec(ctx)
	if err != nil {
		return nil, err
	}
	return nil, nil
}
