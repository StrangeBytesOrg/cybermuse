package db

import (
	"context"
	"fmt"
)

func Fixture(ctx context.Context) {
	fmt.Println("Inserting default data")

	// Create a default user character
	DB.NewInsert().Model(&Character{Name: "User", Description: "A user", Type: "user"}).Exec(ctx)

	// Create a default chat character
	DB.NewInsert().Model(&Character{Name: "Assistant", Description: "A helpful AI assistant designed to help you test the program.", Type: "character"}).Exec(ctx)

	// Create a default chat
	DB.NewInsert().Model(&Chat{}).Exec(ctx)
	DB.NewInsert().Model(&ChatCharacter{ChatId: 1, CharacterId: 1}).Exec(ctx)
	DB.NewInsert().Model(&ChatCharacter{ChatId: 1, CharacterId: 2}).Exec(ctx)

	// Create a default Prompt Template
	chatMlTemplateString := "{{range .Messages}}<|im_start|>{{if .Generated}}assistant{{else}}user{{end}}\n{{.Text}}<|im_end|>\n{{end}}<|im_start|>assistant\n"
	llama3TemplateString := "{{range .Messages}}<|start_header_id|>{{if .Generated}}assistant{{else}}user{{end}}<|end_header_id|>\n\n{{.Text}}<|eot_id|>{{end}}<|start_header_id|>assistant<|end_header_id|>\n\n"
	phi3TemplateString := "{{range .Messages}}<|{{if .Generated}}assistant{{else}}user{{end}}|>{{.Text}}<|end|>\n{{end}}<|assistant|>\n"
	chatMlRoleplay := "<|im_start|>system\nRoleplay as the selected character using the character descriptions provided below. Respond to the chat with a single message.\n{{if .Characters}}{{range .Characters}}{{.Name}}:{{.Description}}\n{{end}}{{end}}<|im_end|>\n{{range .Messages}}<|im_start|>{{if .Generated}}assistant{{else}}user{{end}}\n{{.Text}}<|im_end|>\n{{end}}<|im_start|>assistant\n"
	llama3Roleplay := "<|start_header_id|>system<|end_header_id|>\n\nRoleplay as the selected character using the character descriptions provided below. Respond to the chat with a single reply. Reply for only the selected character. Do no speak for anyone else.\n{{range .Characters}}{{.Name}}: {{.Description}}\n{{end}}<|eot_id|>{{range .Messages}}<|start_header_id|>{{if .Generated}}assistant{{else}}user{{end}}<|end_header_id|>\n\n{{.CharacterName}}: {{.Text}}<|eot_id|>{{end}}<|start_header_id|>assistant<|end_header_id|>\n\n"

	DB.NewInsert().Model(&PromptTemplate{Name: "ChatML", Content: chatMlTemplateString, Active: true}).Exec(ctx)
	DB.NewInsert().Model(&PromptTemplate{Name: "Llama3", Content: llama3TemplateString}).Exec(ctx)
	DB.NewInsert().Model(&PromptTemplate{Name: "Phi3", Content: phi3TemplateString}).Exec(ctx)
	DB.NewInsert().Model(&PromptTemplate{Name: "ChatML Roleplay", Content: chatMlRoleplay}).Exec(ctx)
	DB.NewInsert().Model(&PromptTemplate{Name: "Llama3 Roleplay", Content: llama3Roleplay}).Exec(ctx)

	// Create a default Generate Preset
	DB.NewInsert().Model(&GeneratePreset{
		Name:   "Default",
		Active: true,
		// Add defaults taken from llama.cpp server defaults
		MaxTokens:        64,
		Temperature:      0.8,
		TopK:             40,
		TopP:             0.95,
		MinP:             0.05,
		TFSZ:             1.0, // 1.0 = disabled
		TypicalP:         1.0, // 1.0 = disabled
		RepeatPenalty:    1.1, // 0 = disabled
		RepeatLastN:      64,  // 0 = disabled, -1 = ctx-size
		PenalizeNL:       false,
		PresencePenalty:  0, // 0 = disabled
		FrequencyPenalty: 0, // 0 = disabled
		Mirostat:         0, // 0 = disabled, 1 = mirostat, 2 = mirostat 2.0
		MirostatTau:      5.0,
		MirostatEta:      0.1,
	}).Exec(ctx)

	// Add a default chat message
	DB.NewInsert().Model(&Message{ChatId: 1, CharacterId: 1, ActiveIndex: 0, Generated: false}).Exec(ctx)
	DB.NewInsert().Model(&MessageContent{MessageId: 1, Text: "Hello"}).Exec(ctx)
	DB.NewInsert().Model(&Message{ChatId: 1, CharacterId: 2, ActiveIndex: 0, Generated: true}).Exec(ctx)
	DB.NewInsert().Model(&MessageContent{MessageId: 2, Text: "Hi there, I'm here to help."}).Exec(ctx)
}
