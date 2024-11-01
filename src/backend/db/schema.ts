import {sqliteTable, text, integer, real} from 'drizzle-orm/sqlite-core'
import {sql, relations} from 'drizzle-orm'
import {createInsertSchema} from 'drizzle-zod'
import {z} from 'zod'

/**
 * Character
 */
export const Character = sqliteTable('character', {
    id: integer().primaryKey({autoIncrement: true}),
    name: text().notNull(),
    type: text({enum: ['user', 'character']}).notNull(),
    description: text().notNull(),
    firstMessage: text(),
    image: text(),
})
export const characterRelations = relations(Character, ({many}) => ({
    charactersToChats: many(ChatCharacters),
}))
export const insertCharacterSchema = createInsertSchema(Character, {
    description: z.string().min(1),
    firstMessage: z.string().transform((v) => (v === '' ? null : v)),
    image: z.string().transform((v) => (v === '' ? null : v)),
})

/**
 * Chat
 */
export const Chat = sqliteTable('chat', {
    id: integer().primaryKey({autoIncrement: true}),
    name: text(),
    createdAt: text()
        .default(sql`(CURRENT_TIMESTAMP)`)
        .notNull(),
    updatedAt: text()
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

/**
 * Lore
 */
type Entry = {name: string; content: string}
const entry = z.object({name: z.string(), content: z.string()})
export const Lore = sqliteTable('lore', {
    id: integer().primaryKey({autoIncrement: true}),
    name: text().notNull(),
    entries: text({mode: 'json'}).$type<Entry[]>().notNull(),
})
export const loreRelations = relations(Lore, ({many}) => ({
    loreToChats: many(ChatLore),
}))
export const insertLoreSchema = createInsertSchema(Lore, {entries: z.array(entry)})

// Chat Characters join table
export const ChatCharacters = sqliteTable('chat_characters', {
    id: integer().primaryKey({autoIncrement: true}),
    chatId: integer()
        .references(() => Chat.id, {onDelete: 'cascade'})
        .notNull(),
    characterId: integer()
        .references(() => Character.id, {onDelete: 'cascade'})
        .notNull(),
})
export const charactersToChatsRelations = relations(ChatCharacters, ({one}) => ({
    chat: one(Chat, {fields: [ChatCharacters.chatId], references: [Chat.id]}),
    character: one(Character, {fields: [ChatCharacters.characterId], references: [Character.id]}),
}))

// Chat Lore join table
export const ChatLore = sqliteTable('chat_lore', {
    id: integer().primaryKey({autoIncrement: true}),
    chatId: integer()
        .references(() => Chat.id, {onDelete: 'cascade'})
        .notNull(),
    loreId: integer()
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
    id: integer().primaryKey({autoIncrement: true}),
    chatId: integer()
        .references(() => Chat.id, {onDelete: 'cascade'})
        .notNull(),
    characterId: integer()
        .references(() => Character.id, {onDelete: 'cascade'})
        .notNull(),
    type: text({enum: ['user', 'model', 'system']}).notNull(),
    activeIndex: integer().default(0).notNull(),
    content: text({mode: 'json'}).$type<string[]>().notNull(),
})
export const messageRelations = relations(Message, ({one}) => ({
    chat: one(Chat, {fields: [Message.chatId], references: [Chat.id]}),
    character: one(Character, {fields: [Message.characterId], references: [Character.id]}),
}))
export const insertMessageSchema = createInsertSchema(Message, {
    content: z.array(z.string()),
})

/**
 * User
 */
export const User = sqliteTable('user', {
    id: integer().primaryKey({autoIncrement: true}),
    generatePreset: integer()
        .notNull()
        .references(() => GeneratePreset.id),
    promptTemplate: integer()
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
    id: integer().primaryKey(),
    name: text().notNull(),
    template: text().notNull(),
})
export const insertPromptTemplateSchema = createInsertSchema(PromptTemplate)

/**
 * Generate Preset
 */
export const GeneratePreset = sqliteTable('generate_preset', {
    // Internal
    id: integer().primaryKey(),
    name: text().notNull(),
    context: integer().notNull(),
    // Passed to server
    maxTokens: integer().notNull(),
    temperature: real().notNull(),
    seed: integer().notNull(),
    topK: real(),
    topP: real(),
    minP: real(),
    repeatPenalty: real(),
    repeatLastN: real(),
    penalizeNL: integer({mode: 'boolean'}),
    presencePenalty: real(),
    frequencyPenalty: real(),
})
export const insertPresetSchema = createInsertSchema(GeneratePreset)
