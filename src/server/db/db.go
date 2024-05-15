package db

import (
	"chat-app/src/server/config"
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"time"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/sqlitedialect"
	"github.com/uptrace/bun/driver/sqliteshim"
	"github.com/uptrace/bun/extra/bundebug"
)

var DB *bun.DB

type Character struct {
	Id           int64   `bun:",pk,autoincrement" json:"id"`
	Name         string  `bun:",nullzero" json:"name"`
	Description  string  `bun:",nullzero" json:"description"`
	Type         string  `bun:",notnull,nullzero,default:'character'" json:"type"`
	FirstMessage *string `bun:",nullzero" json:"firstMessage"`
	Image        *string `bun:",nullzero" json:"image"`
}

type Message struct {
	Id          int64             `bun:",pk,autoincrement" json:"id"`
	ChatId      int64             `bun:",notnull,nullzero" json:"chatId"`
	CharacterId int64             `bun:",notnull,nullzero" json:"characterId"`
	Generated   bool              `bun:",notnull" json:"generated"`
	ActiveIndex int64             `bun:",notNull" json:"activeIndex"`
	Content     []*MessageContent `bun:",notnull,rel:has-many,join:id=message_id" json:"content"`
}

type MessageContent struct {
	Id        int64  `bun:",pk,autoincrement" json:"id"`
	Text      string `bun:",notnull" json:"text"`
	MessageId int64  `bun:",notnull,nullzero" json:"messageId"`
}

type Chat struct {
	Id         int64        `bun:",pk,autoincrement" json:"id"`
	CreatedAt  time.Time    `bun:",nullzero,notnull,default:current_timestamp" json:"createdAt"`
	UpdatedAt  bun.NullTime ``
	Characters []*Character `bun:"m2m:chat_characters,join:Chat=Character" json:"characters"`
	Messages   []*Message   `bun:"rel:has-many,join:id=chat_id" json:"messages"`
}

type ChatCharacter struct {
	ChatId      int64      `bun:",pk,nullzero"`
	Chat        *Chat      `bun:"rel:belongs-to,join:chat_id=id"`
	CharacterId int64      `bun:",pk,nullzero"`
	Character   *Character `bun:"rel:belongs-to,join:character_id=id"`
}

type PromptTemplate struct {
	Id      int64  `bun:",pk,autoincrement" json:"id"`
	Name    string `bun:",notnull,nullzero" json:"name"`
	Content string `bun:",notnull,nullzero" json:"content"`
	Active  bool   `bun:",notnull" json:"active"`
}

type GeneratePreset struct {
	Id          int64   `bun:",pk,autoincrement" json:"id,omitempty"`
	Name        string  `bun:",notnull,nullzero" json:"name"`
	Temperature float32 `bun:",notnull" json:"temperature"`
	MaxTokens   int     `bun:",notnull" json:"maxTokens"`
	MinP        float32 `bun:",notnull" json:"minP"`
	TopP        float32 `bun:",notnull" json:"topP"`
	TopK        float32 `bun:",notnull" json:"topK"`
	Active      bool    `bun:",notnull" json:"active"`
}

func InitDB() error {
	appDataDir := config.GetDataPath()

	// TODO use a local path for development for ease of testing
	dbPath := filepath.Join(appDataDir, "app-data.db?cache=shared&_fk=1")
	sqldb, err := sql.Open(sqliteshim.ShimName, dbPath)
	if err != nil {
		panic(err)
	}
	DB = bun.NewDB(sqldb, sqlitedialect.New())

	DB.RegisterModel((*ChatCharacter)(nil))
	DB.RegisterModel((*MessageContent)(nil))

	if os.Getenv("DEV") != "" {
		DB.AddQueryHook(bundebug.NewQueryHook(
			bundebug.WithVerbose(true),
			bundebug.FromEnv("BUNDEBUG"),
		))

		ctx := context.Background()
		DB.ResetModel(ctx, (*Character)(nil))
		DB.ResetModel(ctx, (*Chat)(nil))
		DB.ResetModel(ctx, (*ChatCharacter)(nil))
		DB.ResetModel(ctx, (*Message)(nil))
		DB.ResetModel(ctx, (*MessageContent)(nil))
		DB.ResetModel(ctx, (*PromptTemplate)(nil))
		DB.ResetModel(ctx, (*GeneratePreset)(nil))

		// Create a default user character
		DB.NewInsert().Model(&Character{Name: "User", Description: "A user", Type: "user"}).Exec(ctx)

		// Create a default chat character
		DB.NewInsert().Model(&Character{Name: "Assistant", Description: "A helpful AI assistant designed to help you test the program.", Type: "character"}).Exec(ctx)

		// Create a default chat
		DB.NewInsert().Model(&Chat{}).Exec(ctx)
		DB.NewInsert().Model(&ChatCharacter{ChatId: 1, CharacterId: 1}).Exec(ctx)
		DB.NewInsert().Model(&ChatCharacter{ChatId: 1, CharacterId: 2}).Exec(ctx)

		// Create a default Prompt Template
		chatMlTemplateString := "{{range .Messages}}<|im_start|>{{if .Generated}}assistant{{else}}user{{end}}\n{{.Text}}<|im_end|>\n{{end}}<|im_start|>assistant\n"
		llama3TemplateString := "{{range .Messages}}<|start_header_id|>{{if .Generated}}assistant{{else}}user{{end}}<|end_header_id|>\n\n{{.Text}}<|eot_id|>{{end}}<|start_header_id|>assistant<|end_header_id|>\n\n"
		phi3TemplateString := "{{range .Messages}}<|{{if .Generated}}assistant{{else}}user{{end}}|>{{.Text}}<|end|>\n{{end}}<|assistant|>\n"
		chatMlRoleplay := "<|im_start|>system\nRoleplay as the selected character using the character descriptions provided below. Respond to the chat with a single message.\n{{if .Characters}}{{range .Characters}}{{.Name}}:{{.Description}}\n{{end}}{{end}}<|im_end|>\n{{range .Messages}}<|im_start|>{{if .Generated}}assistant{{else}}user{{end}}\n{{.Text}}<|im_end|>\n{{end}}<|im_start|>assistant\n"
		llama3Roleplay := "<|start_header_id|>system<|end_header_id|>\n\nRoleplay as the selected character using the character descriptions provided below. Respond to the chat with a single reply. Reply for only the selected character. Do no speak for anyone else.\n{{range .Characters}}{{.Name}}: {{.Description}}\n{{end}}<|eot_id|>{{range .Messages}}<|start_header_id|>{{if .Generated}}assistant{{else}}user{{end}}<|end_header_id|>\n\n{{.CharacterName}}: {{.Text}}<|eot_id|>{{end}}<|start_header_id|>assistant<|end_header_id|>\n\n"

		DB.NewInsert().Model(&PromptTemplate{Name: "ChatML", Content: chatMlTemplateString, Active: true}).Exec(ctx)
		DB.NewInsert().Model(&PromptTemplate{Name: "Llama3", Content: llama3TemplateString}).Exec(ctx)
		DB.NewInsert().Model(&PromptTemplate{Name: "Phi3", Content: phi3TemplateString}).Exec(ctx)
		DB.NewInsert().Model(&PromptTemplate{Name: "ChatML Roleplay", Content: chatMlRoleplay}).Exec(ctx)
		DB.NewInsert().Model(&PromptTemplate{Name: "Llama3 Roleplay", Content: llama3Roleplay}).Exec(ctx)

		// Create a default Generate Preset
		DB.NewInsert().Model(&GeneratePreset{Name: "Default", MaxTokens: 32, Temperature: 0.5, MinP: 0, TopP: 0, TopK: 0, Active: true}).Exec(ctx)

		// Add a default chat message
		DB.NewInsert().Model(&Message{ChatId: 1, CharacterId: 1, ActiveIndex: 0, Generated: false}).Exec(ctx)
		DB.NewInsert().Model(&MessageContent{MessageId: 1, Text: "Hello"}).Exec(ctx)
		DB.NewInsert().Model(&Message{ChatId: 1, CharacterId: 2, ActiveIndex: 0, Generated: true}).Exec(ctx)
		DB.NewInsert().Model(&MessageContent{MessageId: 2, Text: "Hi there, I'm here to help."}).Exec(ctx)
	}
	return nil
}
