package controllers

import (
	db "chat-app/src/server/db"
	"context"
	"fmt"

	"github.com/danielgtaylor/huma/v2"
)

func NewSwipe(ctx context.Context, input *struct {
	MessageId int64 `path:"messageId"`
}) (*struct{}, error) {
	messageContent := &db.MessageContent{
		MessageId: input.MessageId,
		Text:      "",
	}
	_, err := db.DB.NewInsert().Model(messageContent).Exec(ctx)
	if err != nil {
		return nil, err
	}

	messageCount, err := db.DB.NewSelect().Model((*db.MessageContent)(nil)).Where("message_id = ?", input.MessageId).Count(ctx)
	if err != nil {
		return nil, err
	}
	fmt.Println("Message count: ", messageCount)
	newIndex := messageCount - 1
	fmt.Println("New index: ", newIndex)

	_, err = db.DB.NewUpdate().Model(&db.Message{}).Set("active_index = ?", newIndex).Where("id = ?", input.MessageId).Exec(ctx)
	if err != nil {
		return nil, err
	}

	return nil, nil
}

func SwipeLeft(ctx context.Context, input *struct {
	MessageId int64 `path:"messageId"`
}) (*struct{}, error) {
	message := &db.Message{}
	err := db.DB.NewSelect().Model(message).Where("id = ?", input.MessageId).Scan(ctx)
	if err != nil {
		return nil, err
	}

	fmt.Println("Active index: ", message.ActiveIndex)

	if message.ActiveIndex <= 0 {
		return nil, huma.Error400BadRequest("Already at the beginning")
	}

	_, err = db.DB.NewUpdate().Model(message).Set("active_index = ?", message.ActiveIndex-1).Where("id = ?", message.Id).Exec(ctx)
	if err != nil {
		return nil, err
	}

	return nil, nil
}

func SwipeRight(ctx context.Context, input *struct {
	MessageId int64 `path:"messageId"`
}) (*struct{}, error) {
	message := &db.Message{}
	err := db.DB.NewSelect().Model(message).Relation("Content").Where("id = ?", input.MessageId).Scan(ctx)
	if err != nil {
		return nil, err
	}

	fmt.Println("Active index: ", message.ActiveIndex)

	if int(message.ActiveIndex) >= len(message.Content)-1 {
		return nil, huma.Error400BadRequest("Already at the end")
	}

	_, err = db.DB.NewUpdate().Model(message).Set("active_index = ?", message.ActiveIndex+1).Where("id = ?", message.Id).Exec(ctx)
	if err != nil {
		return nil, err
	}

	return nil, nil
}
