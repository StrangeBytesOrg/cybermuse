import {z} from 'zod'
import {Collection, createDB} from '@/lib/idb-orm'
import {fixtureData} from '@/db/fixture'

export const db = await createDB('cybermuse', {
    1: async (db) => {
        db.createObjectStore('characters', {keyPath: 'id'})
        db.createObjectStore('lore', {keyPath: 'id'})
        db.createObjectStore('chats', {keyPath: 'id'})
        db.createObjectStore('templates', {keyPath: 'id'})
        db.createObjectStore('generationPresets', {keyPath: 'id'})
    },
})

export const characterCollection = new Collection(
    db,
    'characters',
    z.object({
        id: z.string().min(1, {error: 'ID cannot be empty'}),
        lastUpdate: z.number(),
        deleted: z.number().optional(),
        name: z.string().min(1, {error: 'Name cannot be empty'}),
        description: z.string().min(1, {error: 'Description cannot be empty'}),
        firstMessage: z.string().optional(),
        avatar: z.string().optional(),
        shortDescription: z.string().optional(),
    }),
)

export const loreCollection = new Collection(
    db,
    'lore',
    z.object({
        id: z.string().min(1, {error: 'ID cannot be empty'}),
        lastUpdate: z.number(),
        deleted: z.number().optional(),
        name: z.string().min(1, {error: 'Name cannot be empty'}),
        entries: z.array(z.object({
            name: z.string(),
            content: z.string(),
        })),
    }),
)

export const chatCollection = new Collection(
    db,
    'chats',
    z.object({
        id: z.string().min(1, {error: 'ID cannot be empty'}),
        lastUpdate: z.number(),
        deleted: z.number().optional(),
        name: z.string(),
        userCharacter: z.string().min(1, {error: 'User character must be set'}),
        characters: z.array(z.string()).min(1, {error: 'At least one character must be in the chat'}),
        lore: z.array(z.string()),
        createDate: z.number(),
        messages: z.array(z.object({
            id: z.string(),
            characterId: z.string(),
            type: z.union([
                z.literal('system'),
                z.literal('user'),
                z.literal('assistant'),
            ]),
            content: z.array(z.string()),
            activeIndex: z.number(),
        })),
        archived: z.boolean(),
    }),
)
export type Chat = z.infer<typeof chatCollection.schema>
export type Message = Chat['messages'][0]

export const templateCollection = new Collection(
    db,
    'templates',
    z.object({
        id: z.string().min(1, {error: 'ID cannot be empty'}),
        lastUpdate: z.number(),
        deleted: z.number().optional(),
        name: z.string().min(1, {error: 'Name cannot be empty'}),
        template: z.string(),
    }),
)

export const generationPresetCollection = new Collection(
    db,
    'generationPresets',
    z.object({
        id: z.string().min(1, {error: 'ID cannot be empty'}),
        lastUpdate: z.number(),
        deleted: z.number().optional(),
        name: z.string().min(1, {error: 'Name cannot be empty'}),
        maxTokens: z.number({error: 'Max tokens cannot be empty'}),
        temperature: z.number().optional(),
        seed: z.number().optional(),
        topK: z.number().optional(),
        topP: z.number().optional(),
        minP: z.number().optional(),
        frequencyPenalty: z.number().optional(),
        presencePenalty: z.number().optional(),
    }),
)

// Fixture DB data
await fixtureData(db)
