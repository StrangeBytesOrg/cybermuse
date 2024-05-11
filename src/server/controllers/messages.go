package controllers

import (
	"bytes"
	db "chat-app/src/server/db"
	"chat-app/src/server/util"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/danielgtaylor/huma/v2/sse"
	"github.com/jclem/sseparser"
)

// Create Message
type CreateMessageResponse struct {
	Body struct {
		MessageId int64 `json:"messageId"`
	}
}

func CreateMessage(ctx context.Context, input *struct {
	Body struct {
		ChatId      int64  `json:"chatId"`
		CharacterId int64  `json:"characterId"`
		Text        string `json:"text"`
	}
}) (*CreateMessageResponse, error) {
	message := &db.Message{
		ChatId:      input.Body.ChatId,
		CharacterId: input.Body.CharacterId,
		Text:        input.Body.Text,
		Generated:   false,
	}
	_, err := db.DB.NewInsert().Model(message).Exec(ctx)
	if err != nil {
		return nil, err
	}
	response := &CreateMessageResponse{}
	fmt.Println("New message created:", message)
	response.Body.MessageId = message.Id
	return response, nil
}

// Update Message
func UpdateMessage(ctx context.Context, input *struct {
	Id   int64 `path:"id" doc:"Message ID"`
	Body struct {
		Text string `json:"text"`
	}
}) (*struct{}, error) {
	message := &db.Message{}
	_, err := db.DB.NewUpdate().Model(message).Set("text = ?", input.Body.Text).Where("id = ?", input.Id).Exec(ctx)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

// Delete Message
func DeleteMessage(ctx context.Context, input *struct {
	Id int64 `path:"id" doc:"Message ID"`
}) (*struct{}, error) {
	message := &db.Message{}
	wat, err := db.DB.NewDelete().Model(message).Where("id = ?", input.Id).Exec(ctx)
	if err != nil {
		return nil, err
	}
	fmt.Println("wat:", wat)
	return nil, nil
}

type GenerateMessageInitialResponse struct {
	MessageId   int64 `json:"messageId"`
	CharacterId int64 `json:"characterId"`
}

type GenerateMessageResponse struct {
	Text string `json:"text"`
}

type GenerateMessageFinalResponse struct {
	Text string `json:"text"`
}

type GenerateMessageErrorResponse struct {
	Error string `json:"error"`
}

func GenerateMessage(ctx context.Context, input *struct {
	Body struct {
		ChatId int64 `json:"chatId"`
	}
}, send sse.Sender) {
	chat := &db.Chat{}
	err := db.DB.NewSelect().
		Model(chat).
		Where("id = ?", input.Body.ChatId).
		Relation("Characters").
		Relation("Messages").
		Scan(ctx)
	if err != nil {
		send.Data(&GenerateMessageErrorResponse{Error: "Error fetching chat"})
		return
	}

	// Get the active prompt template
	promptTemplate := &db.PromptTemplate{}
	err = db.DB.NewSelect().Model(promptTemplate).Where("active = true").Scan(ctx)
	if err != nil {
		send.Data(&GenerateMessageErrorResponse{Error: "Error fetching template"})
		return
	}

	prompt, err := util.FormatPrompt(promptTemplate.Content, chat.Messages, chat.Characters)
	if err != nil {
		send.Data(&GenerateMessageErrorResponse{Error: "Error formatting prompt"})
		return
	}

	// Create GBNF grammar to pick the next respondent
	characterNames := []string{}
	for _, character := range chat.Characters {
		if character.Type == "user" {
			continue
		}
		characterNames = append(characterNames, "\""+character.Name+"\"")
	}
	characterString := strings.Join(characterNames, " | ")
	gbnf := "root ::= (" + characterString + ")"

	// Get generation settings
	preset := &db.GeneratePreset{}
	err = db.DB.NewSelect().Model(preset).Where("active = true").Scan(ctx)
	if err != nil {
		send.Data(&GenerateMessageErrorResponse{Error: "Error getting generation preset"})
		return
	}

	// Send request to generation server to get the next respondent
	payload := map[string]any{
		"prompt":       prompt,
		"n_predict":    10,
		"temperature":  0,
		"grammar":      gbnf,
		"cache_prompt": true,
	}
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		fmt.Println("Error marshalling payload: ", err)
		send.Data(&GenerateMessageErrorResponse{Error: "Error marshalling payload"})
		return
	}

	resp, err := http.Post("http://localhost:8080/completion", "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		fmt.Println("Error sending request: ", err)
		send.Data(&GenerateMessageErrorResponse{Error: "Error from built-in server"})
		return
	}
	if resp.StatusCode != http.StatusOK {
		fmt.Println("Error from built-in server: ", resp.Status)
		send.Data(&GenerateMessageErrorResponse{Error: "Error from built-in server"})
		return
	}

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Error reading response body: ", err)
		send.Data(&GenerateMessageErrorResponse{Error: "Error reading response body"})
		return
	}

	type returnData struct {
		Content string `json:"content"`
	}
	res := returnData{}

	err = json.Unmarshal(responseBody, &res)
	if err != nil {
		fmt.Println("Error unmarshalling response: ", err)
		send.Data(&GenerateMessageErrorResponse{Error: "Error unmarshalling response"})
		return
	}
	// fmt.Println("Response Data: ", res)

	// Determine characterId from response
	var pickedCharacter = &db.Character{}
	for _, character := range chat.Characters {
		if strings.Contains(res.Content, character.Name) {
			pickedCharacter = character
			break
		}
	}

	fmt.Println("Picked character name: ", pickedCharacter.Name)

	// Create new message in chat
	message := &db.Message{
		ChatId:      input.Body.ChatId,
		CharacterId: pickedCharacter.Id,
		Text:        "",
		Generated:   true,
	}
	_, err = db.DB.NewInsert().Model(message).Exec(ctx)
	if err != nil {
		send.Data(&GenerateMessageErrorResponse{Error: "Error creating message"})
		return
	}

	// Send the initial response so the client knows which character is responding
	send.Data(&GenerateMessageInitialResponse{MessageId: message.Id, CharacterId: pickedCharacter.Id})

	prompt += pickedCharacter.Name + ": "
	fmt.Println("Prompt: ", prompt)

	// Generate the message content
	payload = map[string]any{
		"stream":       true,
		"prompt":       prompt,
		"n_predict":    preset.MaxTokens,
		"temperature":  preset.Temperature,
		"top_p":        preset.TopP,
		"top_k":        preset.TopK,
		"min_p":        preset.MinP,
		"cache_prompt": true,
	}
	jsonPayload, err = json.Marshal(payload)
	if err != nil {
		fmt.Println("Error marshalling payload: ", err)
		send.Data(&GenerateMessageErrorResponse{Error: "Error marshalling payload"})
		return
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "http://localhost:8080/completion", bytes.NewBuffer(jsonPayload))
	if err != nil {
		fmt.Println("Request Error: ", err)
		send.Data(&GenerateMessageErrorResponse{Error: "Error requesting built-in server"})
		return
	}

	client := &http.Client{}
	resp, err = client.Do(req)
	if err != nil {
		fmt.Println("Error sending request: ", err)
		send.Data(&GenerateMessageErrorResponse{Error: "Error from built-in server"})
		return
	}

	if resp.StatusCode != http.StatusOK {
		fmt.Println("Error from built-in server: ", resp.Status)
		send.Data(&GenerateMessageErrorResponse{Error: "Error from built-in server"})
		return
	}

	defer resp.Body.Close()

	scanner := sseparser.NewStreamScanner(resp.Body)
	bufferedResponse := ""

	for {
		var e event
		_, err := scanner.UnmarshalNext(&e)
		if err != nil {
			if errors.Is(err, context.Canceled) {
				fmt.Println("Connection closed")
				return
			} else if errors.Is(err, sseparser.ErrStreamEOF) {
				fmt.Println("Done")
				break
			} else {
				fmt.Println("Error unmarshalling event: ", err)
				break
			}
		}
		bufferedResponse += e.Data.Content
		_, err = db.DB.NewUpdate().Model(&db.Message{}).Set("text = ?", bufferedResponse).Where("id = ?", message.Id).Exec(ctx)
		if err != nil {
			fmt.Println("Error updating message: ", err)
			send.Data(&GenerateMessageErrorResponse{Error: "Error updating message"})
			return
		}
		send.Data(&GenerateMessageResponse{Text: e.Data.Content})
	}

	fmt.Println("Final response: ", bufferedResponse)
	send.Data(&GenerateMessageFinalResponse{Text: bufferedResponse})
}
