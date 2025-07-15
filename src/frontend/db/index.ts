import Dexie from 'dexie'
import {Collection} from '@/lib/dexie-orm'
import z from 'zod'

export const db = new Dexie('cybermuse')

db.version(2).stores({
    characters: 'id',
    lore: 'id',
    chats: 'id',
    templates: 'id',
    generationPresets: 'id',
}).upgrade(tx => {
    // Migrate messages from using 'model' to 'assistant' type
    return tx.table('chats').toCollection().modify(chat => {
        if (!chat.messages) return
        chat.messages = chat.messages.map(message => {
            if (message.type === 'model') {
                return {...message, type: 'assistant'}
            }
            return message
        })
    })
})

export const characterCollection = new Collection(
    db.table('characters'),
    z.object({
        id: z.string().min(1, {message: 'ID cannot be empty'}),
        lastUpdate: z.number(),
        deleted: z.number().optional(),
        name: z.string().min(1, {message: 'Name cannot be empty'}),
        description: z.string().min(1, {message: 'Description cannot be empty'}),
        firstMessage: z.string().optional(),
        avatar: z.string().optional(),
        shortDescription: z.string().optional(),
    }),
)
export const loreCollection = new Collection(
    db.table('lore'),
    z.object({
        id: z.string().min(1, {message: 'ID cannot be empty'}),
        lastUpdate: z.number(),
        deleted: z.number().optional(),
        name: z.string().min(1, {message: 'Name cannot be empty'}),
        entries: z.array(z.object({
            name: z.string(),
            content: z.string(),
        })),
    }),
)
export const chatCollection = new Collection(
    db.table('chats'),
    z.object({
        id: z.string().min(1, {message: 'ID cannot be empty'}),
        lastUpdate: z.number(),
        deleted: z.number().optional(),
        name: z.string(),
        userCharacter: z.string().min(1, {message: 'User character must be set'}),
        characters: z.array(z.string()).min(1, {message: 'At least one character must be in the chat'}),
        lore: z.array(z.string()),
        createDate: z.number(),
        messages: z.array(z.object({
            id: z.string(),
            characterId: z.string(),
            type: z.union([z.literal('system'), z.literal('user'), z.literal('assistant')]),
            content: z.array(z.string()),
            activeIndex: z.number(),
        })),
        archived: z.boolean(),
    }),
)
export type Chat = z.infer<typeof chatCollection.schema>
export type Message = Chat['messages'][0]
export const templateCollection = new Collection(
    db.table('templates'),
    z.object({
        id: z.string().min(1, {message: 'ID cannot be empty'}),
        lastUpdate: z.number(),
        deleted: z.number().optional(),
        name: z.string().min(1, {message: 'Name cannot be empty'}),
        template: z.string(),
    }),
)
export const generationPresetCollection = new Collection(
    db.table('generationPresets'),
    z.object({
        id: z.string().min(1, {message: 'ID cannot be empty'}),
        lastUpdate: z.number(),
        deleted: z.number().optional(),
        name: z.string().min(1, {message: 'Name cannot be empty'}),
        maxTokens: z.number({message: 'Max tokens cannot be empty'}),
        temperature: z.number().optional(),
        seed: z.number().optional(),
        topK: z.number().optional(),
        topP: z.number().optional(),
        minP: z.number().optional(),
        repeatPenalty: z.object({
            penalty: z.number().optional(),
            presencePenalty: z.number().optional(),
            frequencyPenalty: z.number().optional(),
            lastTokens: z.number().optional(),
            penalizeNewLine: z.boolean().optional(),
        }),
    }),
)

for (const table of db.tables) {
    table.hook('creating', (primKey, obj) => {
        if (!obj.lastUpdate) {
            return {...obj, lastUpdate: Date.now()}
        }
    })
    table.hook('updating', (modifications) => {
        return {...modifications, lastUpdate: Date.now()}
    })
}
