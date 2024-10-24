import {sqliteTable, text, integer, real} from 'drizzle-orm/sqlite-core'
import {sql, relations} from 'drizzle-orm'
import {createSelectSchema, createInsertSchema} from 'drizzle-typebox'
import {Type as t} from '@sinclair/typebox'

/**
 * Character
 */
export const Character = sqliteTable('character', {
    id: integer('id').primaryKey({autoIncrement: true}),
    name: text('name').notNull(),
    type: text('type', {enum: ['user', 'character']}).notNull(),
    description: text('description').notNull(),
    firstMessage: text('firstMessage'),
    image: text('image'),
})
export const characterRelations = relations(Character, ({many}) => ({
    charactersToChats: many(ChatCharacters),
}))
export const selectCharacterSchema = createSelectSchema(Character)
export const insertCharacterSchema = createInsertSchema(Character)

/**
 * Chat
 */
export const Chat = sqliteTable('chat', {
    id: integer('id').primaryKey({autoIncrement: true}),
    createdAt: text('created')
        .default(sql`(CURRENT_TIMESTAMP)`)
        .notNull(),
    updatedAt: text('updated')
        .default(sql`(CURRENT_TIMESTAMP)`)
        .notNull(),
    // characters via relation
    // messages via relation
})
export const chatRelations = relations(Chat, ({many}) => ({
    messages: many(Message),
    characters: many(ChatCharacters),
    lore: many(ChatLore),
}))
export const selectChatSchema = createSelectSchema(Chat)

/**
 * Lore
 */
type Entry = {name: string; content: string}
const entry = t.Object({name: t.String(), content: t.String()})
export const Lore = sqliteTable('lore', {
    id: integer('id').primaryKey({autoIncrement: true}),
    name: text('name').notNull(),
    entries: text('content', {mode: 'json'}).$type<Entry[]>().notNull(),
})
export const loreRelations = relations(Lore, ({many}) => ({
    loreToChats: many(ChatLore),
}))
export const selectLoreSchema = createSelectSchema(Lore, {entries: t.Array(entry)})
export const insertLoreSchema = createInsertSchema(Lore, {entries: t.Array(entry)})

// Chat Characters join table
export const ChatCharacters = sqliteTable('chat_characters', {
    id: integer('id').primaryKey({autoIncrement: true}),
    chatId: integer('chat_id')
        .references(() => Chat.id, {onDelete: 'cascade'})
        .notNull(),
    characterId: integer('character_id')
        .references(() => Character.id, {onDelete: 'cascade'})
        .notNull(),
})
export const charactersToChatsRelations = relations(ChatCharacters, ({one}) => ({
    chat: one(Chat, {fields: [ChatCharacters.chatId], references: [Chat.id]}),
    character: one(Character, {fields: [ChatCharacters.characterId], references: [Character.id]}),
}))
export const selectChatCharactersSchema = createSelectSchema(ChatCharacters)

// Chat Lore join table
export const ChatLore = sqliteTable('chat_lore', {
    id: integer('id').primaryKey({autoIncrement: true}),
    chatId: integer('chat_id')
        .references(() => Chat.id, {onDelete: 'cascade'})
        .notNull(),
    loreId: integer('lore_id')
        .references(() => Lore.id, {onDelete: 'cascade'})
        .notNull(),
})
export const loreToChatsRelations = relations(ChatLore, ({one}) => ({
    chat: one(Chat, {fields: [ChatLore.chatId], references: [Chat.id]}),
    lore: one(Lore, {fields: [ChatLore.loreId], references: [Lore.id]}),
}))

/**
 * Message
 */
export const Message = sqliteTable('message', {
    id: integer('id').primaryKey({autoIncrement: true}),
    chatId: integer('chat_id')
        .references(() => Chat.id, {onDelete: 'cascade'})
        .notNull(),
    characterId: integer('character_id')
        .references(() => Character.id, {onDelete: 'set null'})
        .notNull(),
    type: text('type', {enum: ['user', 'model', 'system']}).notNull(),
    activeIndex: integer('active_index').notNull(),
    content: text('content', {mode: 'json'}).$type<string[]>().notNull(),
})
export const messageRelations = relations(Message, ({one}) => ({
    chat: one(Chat, {fields: [Message.chatId], references: [Chat.id]}),
    character: one(Character, {fields: [Message.characterId], references: [Character.id]}),
}))
export const selectMessageSchema = createSelectSchema(Message, {content: t.Array(t.String())})
export const insertMessageSchema = createInsertSchema(Message)

/**
 * User
 */
export const User = sqliteTable('user', {
    id: integer('id').primaryKey({autoIncrement: true}),
    generatePreset: integer('generate_preset')
        .notNull()
        .references(() => GeneratePreset.id),
    promptTemplate: integer('prompt_template')
        .notNull()
        .references(() => PromptTemplate.id),
})
export const userSettings = relations(User, ({one}) => ({
    promptTemplate: one(PromptTemplate, {fields: [User.promptTemplate], references: [PromptTemplate.id]}),
    generatePreset: one(GeneratePreset, {fields: [User.generatePreset], references: [GeneratePreset.id]}),
}))

/**
 * Prompt Template
 */
export const PromptTemplate = sqliteTable('prompt_template', {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    template: text('template').notNull(),
})
export const selectPromptTemplateSchema = createSelectSchema(PromptTemplate)

/**
 * Generate Preset
 */
export const GeneratePreset = sqliteTable('generate_preset', {
    // Internal
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    context: integer('context').notNull(),
    // Passed to server
    maxTokens: integer('max_tokens').notNull(),
    temperature: real('temperature').notNull(),
    seed: integer('seed').notNull(),
    topK: real('top_k'),
    topP: real('top_p'),
    minP: real('min_p'),
    repeatPenalty: real('repeat_penalty'),
    repeatLastN: real('repeat_last_n'),
    penalizeNL: integer('penalize_nl', {mode: 'boolean'}),
    presencePenalty: real('presence_penalty'),
    frequencyPenalty: real('frequency_penalty'),
})
export const selectPresetSchema = createSelectSchema(GeneratePreset)
export const insertPresetSchema = createInsertSchema(GeneratePreset)
