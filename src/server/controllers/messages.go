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
		MessageId uint32 `json:"messageId"`
	}
}

func CreateMessage(ctx context.Context, input *struct {
	Body struct {
		ChatId      uint32 `json:"chatId"`
		CharacterId uint32 `json:"characterId"`
		Text        string `json:"text"`
		Generated   bool   `json:"generated"`
	}
}) (*CreateMessageResponse, error) {
	message := &db.Message{
		ChatId:      input.Body.ChatId,
		CharacterId: input.Body.CharacterId,
		Generated:   input.Body.Generated,
	}
	_, err := db.DB.NewInsert().Model(message).Exec(ctx)
	if err != nil {
		return nil, err
	}
	_, err = db.DB.NewInsert().Model(&db.MessageContent{Text: input.Body.Text, MessageId: message.Id}).Exec(ctx)
	if err != nil {
		return nil, err
	}

	response := &CreateMessageResponse{}
	response.Body.MessageId = message.Id
	return response, nil
}

// Update Message
func UpdateMessage(ctx context.Context, input *struct {
	Id   uint32 `path:"id"`
	Body struct {
		Text string `json:"text"`
	}
}) (*struct{}, error) {
	message := &db.Message{}
	err := db.DB.NewSelect().Model(message).Where("id = ?", input.Id).Relation("Content").Scan(ctx)
	if err != nil {
		return nil, err
	}
	activeContent := message.Content[message.ActiveIndex]

	_, err = db.DB.NewUpdate().Model(&db.MessageContent{}).Set("text = ?", input.Body.Text).Where("id = ?", activeContent.Id).Exec(ctx)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

// Delete Message
func DeleteMessage(ctx context.Context, input *struct {
	Id uint32 `path:"id"`
}) (*struct{}, error) {
	message := &db.Message{}
	_, err := db.DB.NewDelete().Model(message).Where("id = ?", input.Id).Exec(ctx)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

// Get a response character
type GetResponseCharacterResponse struct {
	Body struct {
		CharacterId uint32 `json:"characterId"`
	}
}

func GetResponseCharacter(ctx context.Context, input *struct {
	ChatId uint32 `path:"chatId"`
}) (*GetResponseCharacterResponse, error) {
	chat := &db.Chat{}
	err := db.DB.NewSelect().
		Model(chat).
		Where("id = ?", input.ChatId).
		Relation("Characters").
		Relation("Messages").
		Relation("Messages.Content").
		Scan(ctx)
	if err != nil {
		return nil, err
	}

	// Get the active prompt template
	promptTemplate := &db.PromptTemplate{}
	err = db.DB.NewSelect().Model(promptTemplate).Where("active = true").Scan(ctx)
	if err != nil {
		return nil, err
	}

	prompt, err := util.FormatPrompt(promptTemplate.Content, chat.Messages, chat.Characters)
	if err != nil {
		return nil, err
	}
	fmt.Println("Pick Character Prompt: ", prompt)

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
	// preset := &db.GeneratePreset{}
	// err = db.DB.NewSelect().Model(preset).Where("active = true").Scan(ctx)
	// if err != nil {
	// 	return nil, err
	// }

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
		return nil, err
	}

	resp, err := http.Post("http://localhost:8080/completion", "application/json", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("Error from built-in server")
	}

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	type ReturnData struct {
		Content string `json:"content"`
	}
	res := ReturnData{}
	err = json.Unmarshal(responseBody, &res)
	if err != nil {
		return nil, err
	}

	// Determine characterId from response
	var pickedCharacter = &db.Character{}
	for _, character := range chat.Characters {
		if strings.Contains(res.Content, character.Name) {
			pickedCharacter = character
			break
		}
	}

	fmt.Println("Picked character name: ", pickedCharacter.Name)

	response := &GetResponseCharacterResponse{}
	response.Body.CharacterId = pickedCharacter.Id
	return response, nil
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
		ChatId   uint32 `json:"chatId"`
		Continue bool   `json:"continue"`
	}
}, send sse.Sender) {
	chat := &db.Chat{}
	err := db.DB.NewSelect().
		Model(chat).
		Where("id = ?", input.Body.ChatId).
		Relation("Characters").
		Relation("Messages").
		Relation("Messages.Content").
		Scan(ctx)
	if err != nil {
		send.Data(&GenerateMessageErrorResponse{Error: "Error fetching chat"})
		return
	}

	// Get the last message
	var lastMessage *db.Message
	if len(chat.Messages) > 0 {
		lastMessage = chat.Messages[len(chat.Messages)-1]
	}
	lastMessageContentId := lastMessage.Content[lastMessage.ActiveIndex].Id

	// Get the message character
	pickedCharacter := &db.Character{}
	for _, character := range chat.Characters {
		if character.Id == lastMessage.CharacterId {
			pickedCharacter = character
			break
		}
	}
	if pickedCharacter.Id == 0 {
		send.Data(&GenerateMessageErrorResponse{Error: "Error getting character"})
		return
	}

	// Get the active prompt template
	promptTemplate := &db.PromptTemplate{}
	err = db.DB.NewSelect().Model(promptTemplate).Where("active = true").Scan(ctx)
	if err != nil {
		send.Data(&GenerateMessageErrorResponse{Error: "Error fetching template"})
		return
	}

	// If set to run in continue mode, remove the last message from the prompt so that it can be appended afterwards
	if input.Body.Continue {
		chat.Messages = chat.Messages[:len(chat.Messages)-1]
	}

	prompt, err := util.FormatPrompt(promptTemplate.Content, chat.Messages, chat.Characters)
	if err != nil {
		send.Data(&GenerateMessageErrorResponse{Error: "Error formatting prompt"})
		return
	}

	prompt += pickedCharacter.Name + ": "
	fmt.Println("Prompt: ", prompt)

	if input.Body.Continue {
		prompt += lastMessage.Content[lastMessage.ActiveIndex].Text
	}

	// Get generation settings
	preset := &db.GeneratePreset{}
	err = db.DB.NewSelect().Model(preset).Where("active = true").Scan(ctx)
	if err != nil {
		send.Data(&GenerateMessageErrorResponse{Error: "Error getting generation preset"})
		return
	}

	// Generate the message content
	jsonPayload, err := json.Marshal(map[string]any{
		"stream":            true,
		"prompt":            prompt,
		"cache_prompt":      true,
		"seed":              42,
		"n_predict":         preset.MaxTokens,
		"temperature":       preset.Temperature,
		"top_k":             preset.TopK,
		"top_p":             preset.TopP,
		"min_p":             preset.MinP,
		"tfs_z":             preset.TFSZ,
		"typical_p":         preset.TypicalP,
		"repeat_penalty":    preset.RepeatPenalty,
		"repeat_last_n":     preset.RepeatLastN,
		"penalize_nl":       preset.PenalizeNL,
		"presence_penalty":  preset.PresencePenalty,
		"frequency_penalty": preset.FrequencyPenalty,
		"mirostat":          preset.Mirostat,
		"mirostat_tau":      preset.MirostatTau,
		"mirostat_eta":      preset.MirostatEta,
	})
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
	resp, err := client.Do(req)
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
	if input.Body.Continue {
		bufferedResponse = lastMessage.Content[lastMessage.ActiveIndex].Text
	}

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
		_, err = db.DB.NewUpdate().Model(&db.MessageContent{}).Set("text = ?", bufferedResponse).Where("id = ?", lastMessageContentId).Exec(ctx)
		if err != nil {
			fmt.Println("Error updating message content: ", err)
			send.Data(&GenerateMessageErrorResponse{Error: "Error updating message content"})
			return
		}

		send.Data(&GenerateMessageResponse{Text: e.Data.Content})
	}

	fmt.Println("Final response: ", bufferedResponse)
	send.Data(&GenerateMessageFinalResponse{Text: bufferedResponse})
}
