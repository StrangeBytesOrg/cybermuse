import {sqliteTable, text, integer, real} from 'drizzle-orm/sqlite-core'
import {relations} from 'drizzle-orm'

export const character = sqliteTable('character', {
    id: integer('id').primaryKey({autoIncrement: true}),
    name: text('name').notNull(),
    description: text('description').notNull(),
    firstMessage: text('firstMessage'),
    image: text('image'),
    type: text('type', {enum: ['user', 'character']}).notNull(),
})

export const chat = sqliteTable('chat', {
    id: integer('id').primaryKey({autoIncrement: true}),
    userCharacter: integer('user_character')
        .references(() => character.id)
        .notNull(),
    createdAt: integer('created').default(Date.now()).notNull(),
    updatedAt: integer('updated').default(Date.now()).notNull(),
})

export const chatCharacters = sqliteTable('chat_characters', {
    id: integer('id').primaryKey({autoIncrement: true}),
    chatId: integer('chat_id')
        .references(() => chat.id, {onDelete: 'cascade'})
        .notNull(),
    characterId: integer('character_id')
        .references(() => character.id, {onDelete: 'cascade'})
        .notNull(),
})

export const message = sqliteTable('message', {
    id: integer('id').primaryKey({autoIncrement: true}),
    chatId: integer('chat_id')
        .references(() => chat.id, {onDelete: 'cascade'})
        .notNull(),
    characterId: integer('character_id').references(() => character.id, {onDelete: 'set null'}),
    text: text('messageText').notNull(),
})

export const promptSetting = sqliteTable('prompt_settings', {
    id: integer('id').primaryKey(),
    instruction: text('instruction').notNull(),
    promptTemplate: text('prompt_template').notNull(),
})

export const generatePresets = sqliteTable('generate_presets', {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    maxTokens: integer('max_tokens').notNull(),
    temperature: real('temperature').notNull(),
    minP: real('min_p'),
    topP: real('top_p'),
    topK: real('top_k'),
})

/**
 * Relations
 */
export const chatRelations = relations(chat, ({many}) => ({
    messages: many(message),
    chatCharacters: many(chatCharacters),
}))

export const characterRelations = relations(character, ({many}) => ({
    charactersToChats: many(chatCharacters),
}))

export const messageRelations = relations(message, ({one}) => ({
    chat: one(chat, {fields: [message.chatId], references: [chat.id]}),
    character: one(character, {fields: [message.characterId], references: [character.id]}),
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
