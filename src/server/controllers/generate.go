package controllers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/danielgtaylor/huma/v2/sse"
	"github.com/jclem/sseparser"
)

type GenerateTextResponse struct {
	Text string `json:"text"`
}

type GenerateFinalResponse struct {
	Text string `json:"text"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type event struct {
	Data  chunk  `sse:"data"`
	Event string `sse:"event"` // Llama.cpp server doesn't actually send SSE events, but if it did, this would be the event name
}

type chunk struct {
	Content string `json:"content"`
	Stop    bool   `json:"stop"`
}

func (c *chunk) UnmarshalSSEValue(v string) error {
	return json.Unmarshal([]byte(v), c)
}

// TODO Log to file
func Generate(ctx context.Context, input *struct {
	Body struct {
		Prompt string `json:"prompt"`
	}
}, send sse.Sender) {
	payload := map[string]any{
		"prompt":    input.Body.Prompt,
		"n_predict": 64,
		"stream":    true,
	}
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		fmt.Println("Error marshalling payload: ", err)
		send.Data(&ErrorResponse{Error: "Error marshalling payload"})
	}
	// TODO enable configurable server URL
	req, err := http.NewRequestWithContext(ctx, "POST", "http://localhost:8080/completion", bytes.NewBuffer(jsonPayload))
	if err != nil {
		fmt.Println("Request Error: ", err)
		send.Data(&ErrorResponse{Error: "Error requesting built-in server"})
	}

	client := &http.Client{}
	// resp, err := http.DefaultClient.Do(req)
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error sending request: ", err)
		send.Data(&ErrorResponse{Error: "Error from built-in server"})
		return
	}

	if resp.StatusCode != http.StatusOK {
		fmt.Println("Error from built-in server: ", resp.Status)
		send.Data(&ErrorResponse{Error: "Error from built-in server"})
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
				// Not sure if we actually need to break here, but probably
				fmt.Println("Error unmarshalling event: ", err)
				break
			}
		}
		// fmt.Println("SSE Event:", e.Event)
		// fmt.Println("Content:", e.Data.Content)
		bufferedResponse += e.Data.Content
		send.Data(&GenerateTextResponse{Text: e.Data.Content})
	}

	fmt.Println("Final response: ", bufferedResponse)
	send.Data(&GenerateFinalResponse{Text: bufferedResponse})
}
