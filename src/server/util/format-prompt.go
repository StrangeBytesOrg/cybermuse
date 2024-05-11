package util

import (
	"bytes"
	"chat-app/src/server/db"
	"text/template"
)

type FormattedMessage struct {
	Generated     bool
	Text          string
	CharacterName string
}

type TemplateData struct {
	Messages   []FormattedMessage
	Characters []*db.Character
}

func FormatPrompt(templateString string, messages []*db.Message, characters []*db.Character) (string, error) {
	characterMap := map[int64]*db.Character{}
	for _, character := range characters {
		characterMap[character.Id] = character
	}

	formattedMessages := []FormattedMessage{}
	for _, message := range messages {
		newMessage := FormattedMessage{}
		newMessage.Text = message.Text
		newMessage.Generated = message.Generated
		newMessage.CharacterName = characterMap[message.CharacterId].Name
		formattedMessages = append(formattedMessages, newMessage)
	}

	promptTemplate, err := template.New("prompt-template").Parse(templateString)
	if err != nil {
		return "", err
	}
	buf := &bytes.Buffer{}
	err = promptTemplate.Execute(buf, &TemplateData{
		Messages:   formattedMessages,
		Characters: characters,
	})
	if err != nil {
		return "", err
	}

	return buf.String(), nil
}
