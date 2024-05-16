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

type GenerationSettings struct {
	MaxTokens   uint    `json:"maxTokens"`
	Temperature float32 `json:"temperature"`
	// dynatemp_range
	// dynatemp_exponent
	TopK float32 `json:"topK,omitempty"`
	TopP float32 `json:"topP,omitempty"`
	MinP float32 `json:"minP,omitempty"`
	// stop
	TFSZ             float32 `json:"tfsz,omitempty"`
	TypicalP         float32 `json:"typicalP,omitempty"`
	RepeatPenalty    float32 `json:"repeatPenalty,omitempty"`
	RepeatLastN      float32 `json:"repeatLastN,omitempty"`
	PenalizeNL       bool    `json:"penalizeNL,omitempty"`
	PresencePenalty  float32 `json:"presencePenalty,omitempty"`
	FrequencyPenalty float32 `json:"frequencyPenalty,omitempty"`
	// PenaltyPrompt    string  `json:"penaltyPrompt,omitempty"`
	Mirostat    uint    `json:"mirostat,omitempty"`
	MirostatTau float32 `json:"mirostatTau,omitempty"`
	MirostatEta float32 `json:"mirostatEta,omitempty"`
	// Samplers []string `json:"samplers"`
}

func CreatePreset(ctx context.Context, input *struct {
	Body struct {
		Name string `json:"name" minLength:"1"`
		GenerationSettings
	}
}) (*CreatePresetResponse, error) {
	preset := &db.GeneratePreset{
		Name:             input.Body.Name,
		MaxTokens:        input.Body.MaxTokens,
		Temperature:      input.Body.Temperature,
		TopK:             input.Body.TopK,
		TopP:             input.Body.TopP,
		MinP:             input.Body.MinP,
		TFSZ:             input.Body.TFSZ,
		TypicalP:         input.Body.TypicalP,
		RepeatPenalty:    input.Body.RepeatPenalty,
		RepeatLastN:      input.Body.RepeatLastN,
		PenalizeNL:       input.Body.PenalizeNL,
		PresencePenalty:  input.Body.PresencePenalty,
		FrequencyPenalty: input.Body.FrequencyPenalty,
		Mirostat:         input.Body.Mirostat,
		MirostatTau:      input.Body.MirostatTau,
		MirostatEta:      input.Body.MirostatEta,
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
		Name string `json:"name"`
		GenerationSettings
	}
}) (*struct{}, error) {
	_, err := db.DB.NewUpdate().
		Model(&db.GeneratePreset{}).
		Where("id = ?", input.Id).
		Set("name = ?", input.Body.Name).
		Set("max_tokens = ?", input.Body.MaxTokens).
		Set("temperature = ?", input.Body.Temperature).
		Set("top_k = ?", input.Body.TopK).
		Set("top_p = ?", input.Body.TopP).
		Set("min_p = ?", input.Body.MinP).
		Set("tfsz = ?", input.Body.TFSZ).
		Set("typical_p = ?", input.Body.TypicalP).
		Set("repeat_penalty = ?", input.Body.RepeatPenalty).
		Set("repeat_last_n = ?", input.Body.RepeatLastN).
		Set("penalize_nl = ?", input.Body.PenalizeNL).
		Set("presence_penalty = ?", input.Body.PresencePenalty).
		Set("frequency_penalty = ?", input.Body.FrequencyPenalty).
		Set("mirostat = ?", input.Body.Mirostat).
		Set("mirostat_tau = ?", input.Body.MirostatTau).
		Set("mirostat_eta = ?", input.Body.MirostatEta).
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
