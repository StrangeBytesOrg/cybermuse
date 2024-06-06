package controllers

import (
	db "chat-app/src/server/db"
	"chat-app/src/server/util"
	"context"
	"fmt"

	"github.com/danielgtaylor/huma/v2"
)

// Get all chats
type GetAllTemplatesResponse struct {
	Body struct {
		Templates []db.PromptTemplate `json:"templates"`
	}
}

func GetAllTemplates(ctx context.Context, input *struct{}) (*GetAllTemplatesResponse, error) {
	templates := &[]db.PromptTemplate{}
	err := db.DB.NewSelect().Model(templates).Scan(ctx)
	if err != nil {
		return nil, err
	}
	response := &GetAllTemplatesResponse{}
	response.Body.Templates = *templates
	return response, nil
}

// Get a single template
type GetTemplateResponse struct {
	Body struct {
		Template db.PromptTemplate `json:"template"`
	}
}

func GetTemplate(ctx context.Context, input *struct {
	Id string `path:"id" doc:"Template Id"`
}) (*GetTemplateResponse, error) {
	template := &db.PromptTemplate{}
	err := db.DB.NewSelect().Model(template).Where("id = ?", input.Id).Scan(ctx)
	if err != nil {
		return nil, err
	}
	response := &GetTemplateResponse{}
	response.Body.Template = *template
	return response, nil
}

// Create a template
type CreateTemplateResponse struct {
	Body struct {
		Id uint32 `json:"id"`
	}
}

func CreateTemplate(ctx context.Context, input *struct {
	Body struct {
		Name    string `json:"name" minLength:"1"`
		Content string `json:"content"`
	}
}) (*CreateTemplateResponse, error) {
	_, err := util.FormatPrompt(input.Body.Content, nil, nil)
	if err != nil {
		return nil, huma.Error400BadRequest(err.Error())
	}

	template := &db.PromptTemplate{
		Name:    input.Body.Name,
		Content: input.Body.Content,
	}
	_, err = db.DB.NewInsert().Model(template).Exec(ctx)
	if err != nil {
		return nil, err
	}
	response := &CreateTemplateResponse{}
	response.Body.Id = template.Id
	return response, nil
}

// Update template
func UpdateTemplate(ctx context.Context, input *struct {
	Id   string `path:"id" doc:"Template Id"`
	Body struct {
		Name    string `json:"name"`
		Content string `json:"content"`
	}
}) (*struct{}, error) {
	_, err := util.FormatPrompt(input.Body.Content, nil, nil)
	if err != nil {
		return nil, huma.Error400BadRequest(err.Error())
	}

	template := &db.PromptTemplate{}
	_, err = db.DB.NewUpdate().
		Model(template).
		Set("name = ?", input.Body.Name).
		Set("content = ?", input.Body.Content).
		Where("id = ?", input.Id).
		Exec(ctx)
	if err != nil {
		return nil, err
	}
	return &struct{}{}, nil
}

// Delete a template
func DeleteTemplate(ctx context.Context, input *struct {
	Id string `path:"id" doc:"Template Id"`
}) (*struct{}, error) {
	_, err := db.DB.NewDelete().Model(&db.PromptTemplate{}).Where("id = ?", input.Id).Exec(ctx)
	if err != nil {
		return nil, err
	}
	return &struct{}{}, nil
}

// Parse a template
type ParseTemplateResponse struct {
	Body struct {
		Parsed string `json:"parsed"`
	}
}

func ParseTemplate(ctx context.Context, input *struct {
	Body struct {
		TemplateString string `json:"templateString"`
	}
}) (*ParseTemplateResponse, error) {
	exampleMessages := []*db.Message{
		{Id: 1, ChatId: 1, CharacterId: 1, Generated: false, Content: []*db.MessageContent{
			{MessageId: 1, Text: "Hello, how are you?"},
		}},
		{Id: 2, ChatId: 1, CharacterId: 2, Generated: true, Content: []*db.MessageContent{
			{MessageId: 2, Text: "I'm doing well, thank you."},
		}},
		{Id: 3, ChatId: 1, CharacterId: 1, Generated: false, Content: []*db.MessageContent{
			{MessageId: 3, Text: "Tell me a story"},
		}},
	}
	exampleCharacters := []*db.Character{
		{Id: 1, Name: "User", Description: "A user", Type: "user"},
		{Id: 2, Name: "Assistant", Description: "A helpful AI assistant designed to help you test the program.", Type: "character"},
	}

	prompt, err := util.FormatPrompt(input.Body.TemplateString, exampleMessages, exampleCharacters)
	if err != nil {
		return nil, err
	}
	fmt.Println("Prompt: ", prompt)

	response := &ParseTemplateResponse{}
	response.Body.Parsed = prompt
	return response, nil
}

func SetActive(ctx context.Context, input *struct {
	Id string `path:"id" doc:"Template Id"`
}) (*struct{}, error) {
	// Set existing active template to false
	_, err := db.DB.NewUpdate().Model(&db.PromptTemplate{}).Set("active = false").Where("active = true").Exec(ctx)
	if err != nil {
		return nil, err
	}
	// Set new active template
	template := &db.PromptTemplate{}
	_, err = db.DB.NewUpdate().Model(template).Set("active = true").Where("id = ?", input.Id).Exec(ctx)
	if err != nil {
		return nil, err
	}
	return &struct{}{}, nil
}
