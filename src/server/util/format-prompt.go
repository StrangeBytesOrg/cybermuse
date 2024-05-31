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
	characterMap := map[uint32]*db.Character{}
	for _, character := range characters {
		characterMap[character.Id] = character
	}

	formattedMessages := []FormattedMessage{}
	for _, message := range messages {
		activeText := message.Content[message.ActiveIndex].Text
		messageCharacter := characterMap[message.CharacterId]

		// Skip empty messages
		if activeText == "" {
			continue
		}

		newMessage := FormattedMessage{}
		newMessage.Text = activeText
		newMessage.Generated = message.Generated
		newMessage.CharacterName = messageCharacter.Name
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
