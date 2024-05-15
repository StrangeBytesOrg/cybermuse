package controllers

import (
	db "chat-app/src/server/db"
	"context"
	"fmt"
)

// Get all characters
type GetAllCharactersResponse struct {
	Body struct {
		Characters []db.Character `json:"characters"`
	}
}

func GetAllCharacters(ctx context.Context, input *struct{}) (*GetAllCharactersResponse, error) {
	characters := &[]db.Character{}
	err := db.DB.NewSelect().Model(characters).Scan(ctx)
	if err != nil {
		return nil, err
	}
	response := &GetAllCharactersResponse{}
	response.Body.Characters = *characters
	return response, nil
}

// Get a single character
type GetCharacterResponse struct {
	Body struct {
		Character db.Character `json:"character"`
	}
}

func GetCharacter(ctx context.Context, input *struct {
	Id string `path:"id"`
}) (*GetCharacterResponse, error) {
	character := &db.Character{}
	err := db.DB.NewSelect().Model(character).Where("id = ?", input.Id).Scan(ctx)
	if err != nil {
		fmt.Printf("Error getting character: %v\n", err)
		return nil, err
	}

	fmt.Printf("Character: %v\n", character)
	response := &GetCharacterResponse{}
	response.Body.Character = *character
	return response, nil
}

// Create Character
type CreateCharacterResponse struct {
	Body struct {
		Character db.Character `json:"character"`
	}
}

func CreateCharacter(ctx context.Context, input *struct {
	Body struct {
		Name         string `json:"name"`
		Description  string `json:"description"`
		FirstMessage string `json:"firstMessage,omitempty"`
		Type         string `json:"type,omitempty"`
		Image        string `json:"image,omitempty"`
	}
}) (*CreateCharacterResponse, error) {
	character := db.Character{
		Name:        input.Body.Name,
		Description: input.Body.Description,
		Type:        input.Body.Type,
	}
	if input.Body.Image != "" {
		character.Image = &input.Body.Image
	}
	if input.Body.FirstMessage != "" {
		character.FirstMessage = &input.Body.FirstMessage
	}
	_, err := db.DB.NewInsert().Model(&character).Exec(ctx)
	if err != nil {
		fmt.Printf("Error creating character: %v\n", err)
		return nil, err
	}
	fmt.Println("Created character: ", character)
	response := &CreateCharacterResponse{}
	response.Body.Character = character
	return response, nil
}

// Update Character
func UpdateCharacter(ctx context.Context, input *struct {
	Id   string `path:"id"`
	Body struct {
		Name         string `json:"name"`
		Description  string `json:"description"`
		FirstMessage string `json:"firstMessage,omitempty"`
		Type         string `json:"type,omitempty"`
		Image        string `json:"image,omitempty"`
	}
}) (*struct{}, error) {
	character := &db.Character{}
	_, err := db.DB.NewUpdate().Model(character).Set("name = ?", input.Body.Name).Set("description = ?", input.Body.Description).Set("type = ?", input.Body.Type).Set("image = ?", input.Body.Image).Set("first_message = ?", input.Body.FirstMessage).Where("id = ?", input.Id).Exec(ctx)
	if err != nil {
		fmt.Printf("Error updating character: %v\n", err)
		return nil, err
	}
	return &struct{}{}, nil
}

// Delete Character
func DeleteCharacter(ctx context.Context, input *struct {
	CharacterId string `path:"id"`
}) (*struct{}, error) {
	character := &db.Character{}
	_, err := db.DB.NewDelete().Model(character).Where("id = ?", input.CharacterId).Exec(ctx)
	if err != nil {
		fmt.Printf("Error deleting character: %v\n", err)
		return nil, err
	}
	return nil, nil
}
