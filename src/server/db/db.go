package db

import (
	"chat-app/src/server/config"
	"context"
	"database/sql"
	"embed"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/pressly/goose/v3"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/sqlitedialect"
	"github.com/uptrace/bun/driver/sqliteshim"
	"github.com/uptrace/bun/extra/bundebug"
)

var DB *bun.DB

type Character struct {
	Id           uint32  `bun:",pk,autoincrement" json:"id"`
	Name         string  `bun:",nullzero" json:"name"`
	Description  string  `bun:",nullzero" json:"description"`
	Type         string  `bun:",notnull,nullzero,default:'character'" json:"type"`
	FirstMessage *string `bun:",nullzero" json:"firstMessage"`
	Image        *string `bun:",nullzero" json:"image"`
}

type Message struct {
	Id          uint32            `bun:",pk,autoincrement" json:"id"`
	ChatId      uint32            `bun:",notnull,nullzero" json:"chatId"`
	CharacterId uint32            `bun:",notnull,nullzero" json:"characterId"`
	Generated   bool              `bun:",notnull" json:"generated"`
	ActiveIndex uint32            `bun:",notnull" json:"activeIndex"`
	Content     []*MessageContent `bun:",notnull,rel:has-many,join:id=message_id" json:"content"`
}

type MessageContent struct {
	Id        uint32 `bun:",pk,autoincrement" json:"id"`
	Text      string `bun:",notnull" json:"text"`
	MessageId uint32 `bun:",notnull,nullzero" json:"messageId"`
}

type Chat struct {
	Id         uint32       `bun:",pk,autoincrement" json:"id"`
	CreatedAt  time.Time    `bun:",nullzero,notnull,default:current_timestamp" json:"createdAt"`
	UpdatedAt  time.Time    `bun:",nullzero,notnull,default:current_timestamp" json:"updatedAt"`
	Characters []*Character `bun:"m2m:chat_characters,join:Chat=Character" json:"characters"`
	Messages   []*Message   `bun:"rel:has-many,join:id=chat_id" json:"messages"`
}

type ChatCharacter struct {
	ChatId      uint32     `bun:",pk,nullzero"`
	Chat        *Chat      `bun:"rel:belongs-to,join:chat_id=id"`
	CharacterId uint32     `bun:",pk,nullzero"`
	Character   *Character `bun:"rel:belongs-to,join:character_id=id"`
}

type PromptTemplate struct {
	Id      uint32 `bun:",pk,autoincrement" json:"id"`
	Name    string `bun:",notnull,nullzero" json:"name"`
	Content string `bun:",notnull,nullzero" json:"content"`
	Active  bool   `bun:",notnull" json:"active"`
}

type GeneratePreset struct {
	// Internal
	Id      uint32 `bun:",pk,autoincrement" json:"id,omitempty"`
	Name    string `bun:",notnull,nullzero" json:"name"`
	Active  bool   `bun:",notnull" json:"active"`
	Context uint   `bun:",notnull" json:"context"`
	// Passed to server
	MaxTokens        uint    `json:"maxTokens"`
	Temperature      float32 `json:"temperature"`
	Seed             int32   `json:"seed"`
	TopK             float32 `bun:"top_k" json:"topK"`
	TopP             float32 `bun:"top_p" json:"topP"`
	MinP             float32 `bun:"min_p" json:"minP"`
	TFSZ             float32 `json:"tfsz"`
	TypicalP         float32 `bun:"typical_p" json:"typicalP"`
	RepeatPenalty    float32 `json:"repeatPenalty"`
	RepeatLastN      float32 `bun:"repeat_last_n" json:"repeatLastN"`
	PenalizeNL       bool    `json:"penalizeNL"`
	PresencePenalty  float32 `json:"presencePenalty"`
	FrequencyPenalty float32 `json:"frequencyPenalty"`
	Mirostat         uint    `json:"mirostat"`
	MirostatTau      float32 `json:"mirostatTau"`
	MirostatEta      float32 `json:"mirostatEta"`
}

//go:embed migrations
var embedMigrations embed.FS

func InitDB() error {
	appDataDir := config.GetDataPath()

	var dbPath string
	if os.Getenv("DEV") != "" {
		dbPath = "./dev.db?cache=shared&_fk=1"
	} else {
		dbPath = filepath.Join(appDataDir, "app-data.db?cache=shared&_fk=1")
	}
	sqldb, err := sql.Open(sqliteshim.ShimName, dbPath)
	if err != nil {
		panic(err)
	}
	fmt.Println("Connected to database:", dbPath)
	DB = bun.NewDB(sqldb, sqlitedialect.New())

	// Relationships must be registered before ResetModel will work
	DB.RegisterModel((*ChatCharacter)(nil))
	DB.RegisterModel((*MessageContent)(nil))

	if os.Getenv("VERBOSE") != "" {
		DB.AddQueryHook(bundebug.NewQueryHook(
			bundebug.WithVerbose(true),
			bundebug.FromEnv("BUNDEBUG"),
		))
	}

	// Actually enable foreign keys. fk=1 doesn't seem to work
	if _, err := DB.Exec("PRAGMA foreign_keys = ON;"); err != nil {
		panic(err)
	}

	// Run Goose migrations
	fmt.Println("Running migrations")
	goose.SetBaseFS(embedMigrations)
	if err := goose.SetDialect("sqlite"); err != nil {
		panic(err)
	}
	if err := goose.Up(sqldb, "migrations"); err != nil {
		panic(err)
	}

	// Create tables from schema
	if os.Getenv("INIT_DB") != "" {
		fmt.Println("Creating tables from schema")
		ctx := context.Background()
		// DB.ResetModel(ctx, (*GooseDbVersion)(nil))
		DB.ResetModel(ctx, (*Character)(nil))
		DB.ResetModel(ctx, (*Chat)(nil))
		// DB.ResetModel(ctx, (*ChatCharacter)(nil))
		// DB.ResetModel(ctx, (*Message)(nil))
		// DB.ResetModel(ctx, (*MessageContent)(nil))
		DB.ResetModel(ctx, (*PromptTemplate)(nil))
		DB.ResetModel(ctx, (*GeneratePreset)(nil))
		DB.NewCreateTable().
			Model((*ChatCharacter)(nil)).
			IfNotExists().
			Table("chat_characters").
			ForeignKey(`(chat_id) REFERENCES "chats" ("id") ON DELETE CASCADE`).
			// ForeignKey(`(character_id) REFERENCES "characters" ("id") ON DELETE CASCADE`).
			Exec(ctx)
		DB.NewCreateTable().
			Model((*Message)(nil)).
			IfNotExists().
			Table("messages").
			ForeignKey(`(chat_id) REFERENCES "chats" ("id") ON DELETE CASCADE`).
			Exec(ctx)
		DB.NewCreateTable().
			Model((*MessageContent)(nil)).
			IfNotExists().
			Table("message_content").
			ForeignKey(`(message_id) REFERENCES "messages" ("id") ON DELETE CASCADE`).
			Exec(ctx)
	}

	// Check if the database is empty
	// TODO use a join or similar
	ctx := context.Background()
	characterCount, err := DB.NewSelect().Model((*Character)(nil)).Count(ctx)
	if err != nil {
		fmt.Println("Error fixturing")
	}
	templateCount, err := DB.NewSelect().Model((*PromptTemplate)(nil)).Count(ctx)
	if err != nil {
		fmt.Println("Error fixturing")
	}
	presetCount, err := DB.NewSelect().Model((*GeneratePreset)(nil)).Count(ctx)
	if err != nil {
		fmt.Println("Error fixturing")
	}
	count := characterCount + templateCount + presetCount
	if count == 0 {
		Fixture(ctx)
	}

	return nil
}
