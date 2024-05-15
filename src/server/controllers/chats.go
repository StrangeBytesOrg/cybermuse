package controllers

import (
	db "chat-app/src/server/db"
	"context"
	"fmt"
)

// Get all chats
type GetAllChatsResponse struct {
	Body struct {
		Chats []db.Chat `json:"chats"`
	}
}

func GetAllChats(ctx context.Context, input *struct{}) (*GetAllChatsResponse, error) {
	chats := &[]db.Chat{}
	err := db.DB.NewSelect().Model(chats).Relation("Characters").Scan(ctx)
	if err != nil {
		return nil, err
	}
	response := &GetAllChatsResponse{}
	response.Body.Chats = *chats
	return response, nil
}

// Get a single chat
type GetChatResponse struct {
	Body struct {
		Chat db.Chat `json:"chat"`
	}
}

func GetChat(ctx context.Context, input *struct {
	Id string `path:"id"`
}) (*GetChatResponse, error) {
	chat := &db.Chat{}
	err := db.DB.NewSelect().
		Model(chat).
		Where("id = ?", input.Id).
		Relation("Characters").
		Relation("Messages").
		Relation("Messages.Content").
		Scan(ctx)
	if err != nil {
		fmt.Printf("Error getting chat: %v\n", err)
		return nil, err
	}
	response := &GetChatResponse{}
	response.Body.Chat = *chat
	return response, nil
}

// Create Chat
type CreateChatResponse struct {
	Body struct {
		ChatId string `json:"chat_id"`
	}
}

func CreateChat(ctx context.Context, input *struct {
	Body struct {
		Characters []int64 `json:"characters"`
	}
}) (*CreateChatResponse, error) {
	// Create chat
	chat := &db.Chat{}
	_, err := db.DB.NewInsert().Model(chat).Exec(ctx)
	if err != nil {
		return nil, err
	}

	// Add characters to chat
	for _, characterId := range input.Body.Characters {
		_, err := db.DB.NewInsert().Model(&db.ChatCharacter{
			ChatId:      chat.Id,
			CharacterId: characterId,
		}).Exec(ctx)
		if err != nil {
			return nil, err
		}
	}

	response := &CreateChatResponse{}
	response.Body.ChatId = fmt.Sprint(chat.Id)
	return response, nil
}

// Delete Chat
func DeleteChat(ctx context.Context, input *struct {
	Id string `path:"id"`
}) (*struct{}, error) {
	chat := &db.Chat{}
	_, err := db.DB.NewDelete().Model(chat).Where("id = ?", input.Id).Exec(ctx)
	if err != nil {
		return nil, err
	}
	return &struct{}{}, nil
}
