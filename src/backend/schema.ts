import {sqliteTable, text, integer, real} from 'drizzle-orm/sqlite-core'
import {sql, relations} from 'drizzle-orm'
import {createSelectSchema, createInsertSchema} from 'drizzle-zod'

export const user = sqliteTable('user', {
    id: integer('id').primaryKey({autoIncrement: true}),
    generatePreset: integer('generate_preset').references(() => generatePresets.id),
    promptTemplate: integer('prompt_template').references(() => promptTemplate.id),
})

export const character = sqliteTable('character', {
    id: integer('id').primaryKey({autoIncrement: true}),
    name: text('name').notNull(),
    type: text('type', {enum: ['user', 'character']}).notNull(),
    description: text('description').notNull(),
    firstMessage: text('firstMessage'),
    image: text('image'),
})
export const selectCharacterSchema = createSelectSchema(character)
export const insertCharacterSchema = createInsertSchema(character)

export const chat = sqliteTable('chat', {
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
export const selectChatSchema = createSelectSchema(chat)

export const chatCharacters = sqliteTable('chat_characters', {
    id: integer('id').primaryKey({autoIncrement: true}),
    chatId: integer('chat_id')
        .references(() => chat.id, {onDelete: 'cascade'})
        .notNull(),
    characterId: integer('character_id')
        .references(() => character.id, {onDelete: 'cascade'})
        .notNull(),
})
export const selectChatCharactersSchema = createSelectSchema(chatCharacters)

export const message = sqliteTable('message', {
    id: integer('id').primaryKey({autoIncrement: true}),
    chatId: integer('chat_id')
        .references(() => chat.id, {onDelete: 'cascade'})
        .notNull(),
    characterId: integer('character_id')
        .references(() => character.id, {onDelete: 'set null'})
        .notNull(),
    generated: integer('generated', {mode: 'boolean'}).notNull(),
    activeIndex: integer('active_index').notNull(),
})
export const selectMessageSchema = createSelectSchema(message)
export const insertMessageSchema = createInsertSchema(message)

export const messageContent = sqliteTable('message_content', {
    id: integer('id').primaryKey({autoIncrement: true}),
    text: text('text').notNull(),
    messageId: integer('message_id')
        .references(() => message.id, {onDelete: 'cascade'})
        .notNull(),
})
export const selectMessageContentSchema = createSelectSchema(messageContent)

export const promptTemplate = sqliteTable('prompt_template', {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    content: text('instruction').notNull(),
})
export const selectPromptTemplateSchema = createSelectSchema(promptTemplate)

export const generatePresets = sqliteTable('generate_presets', {
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
    tfsz: real('tfsz'),
    typicalP: real('typical_p'),
    repeatPenalty: real('repeat_penalty'),
    repeatLastN: real('repeat_last_n'),
    penalizeNL: integer('penalize_nl', {mode: 'boolean'}),
    presencePenalty: real('presence_penalty'),
    frequencyPenalty: real('frequency_penalty'),
    mirostat: integer('mirostat'),
    mirostatTau: real('mirostat_tau'),
    mirostatEta: real('mirostat_eta'),
})
export const selectPresetSchema = createSelectSchema(generatePresets)
export const insertPresetSchema = createInsertSchema(generatePresets)

/**
 * Relations
 */
export const chatRelations = relations(chat, ({many}) => ({
    messages: many(message),
    characters: many(chatCharacters),
}))

export const characterRelations = relations(character, ({many}) => ({
    charactersToChats: many(chatCharacters),
}))

export const messageRelations = relations(message, ({one, many}) => ({
    chat: one(chat, {fields: [message.chatId], references: [chat.id]}),
    character: one(character, {fields: [message.characterId], references: [character.id]}),
    content: many(messageContent),
}))

export const messageContentRelations = relations(messageContent, ({one}) => ({
    message: one(message, {fields: [messageContent.messageId], references: [message.id]}),
}))

export const charactersToChatsRelations = relations(chatCharacters, ({one}) => ({
    chat: one(chat, {
        fields: [chatCharacters.chatId],
        references: [chat.id],
    }),
    character: one(character, {
        fields: [chatCharacters.characterId],
        references: [character.id],
    }),
}))

export const userSettings = relations(user, ({one}) => ({
    promptTemplate: one(promptTemplate, {fields: [user.promptTemplate], references: [promptTemplate.id]}),
    generatePreset: one(generatePresets, {fields: [user.generatePreset], references: [generatePresets.id]}),
}))
