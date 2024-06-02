package controllers

import (
	"bytes"
	db "chat-app/src/server/db"
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"image"
	_ "image/png" // Required for image.Decode
	"strings"

	"github.com/chai2010/webp"
	"github.com/nfnt/resize"
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
		convertedImage, err := convertImageToWebP(input.Body.Image)
		if err != nil {
			fmt.Println("Error converting image to webp: ", err)
			return nil, err
		}
		character.Image = &convertedImage
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

func convertImageToWebP(dataURL string) (string, error) {
	// Split the data URL
	parts := strings.SplitN(dataURL, ",", 2)
	if len(parts) != 2 {
		return "", errors.New("invalid data URL")
	}

	// Decode the base64 image
	imageData, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return "", fmt.Errorf("failed to decode base64 image: %w", err)
	}

	// Decode the image
	img, format, err := image.Decode(bytes.NewReader(imageData))
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %w", err)
	}
	fmt.Printf("Decoded image format: %s\n", format)

	// Resize down if greater than 1024x1024
	if img.Bounds().Dx() > 1024 {
		img = resize.Resize(1024, 0, img, resize.Lanczos3)
	}

	// Encode to WebP
	var webpBuffer bytes.Buffer
	if err := webp.Encode(&webpBuffer, img, &webp.Options{Lossless: true}); err != nil {
		return "", fmt.Errorf("failed to encode image to webp: %w", err)
	}

	// Encode WebP to base64
	webpBase64 := base64.StdEncoding.EncodeToString(webpBuffer.Bytes())

	// Create the new data URL
	return "data:image/webp;base64," + webpBase64, nil
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
