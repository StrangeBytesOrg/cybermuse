import {z} from 'zod'
import {Collection, createDB, makeSchema} from '@/lib/idb-orm'
import {fixtureData} from '@/db/fixture'

export const db = await createDB('cybermuse', 1, {
    1: async (db) => {
        db.createObjectStore('characters', {keyPath: 'id'})
        db.createObjectStore('lore', {keyPath: 'id'})
        db.createObjectStore('chats', {keyPath: 'id'})
        db.createObjectStore('templates', {keyPath: 'id'})
        db.createObjectStore('generationPresets', {keyPath: 'id'})
        db.createObjectStore('deletions', {keyPath: 'id'})
    },
})

export const characterCollection = new Collection({
    db,
    store: 'characters',
    version: 0,
    schema: makeSchema({
        name: z.string().min(1, {error: 'Name cannot be empty'}),
        description: z.string().min(1, {error: 'Description cannot be empty'}),
        firstMessage: z.string().optional(),
        avatar: z.string().optional(),
        shortDescription: z.string().optional(),
    }),
})

export const loreCollection = new Collection({
    db,
    store: 'lore',
    version: 0,
    schema: makeSchema({
        name: z.string().min(1, {error: 'Name cannot be empty'}),
        entries: z.array(z.object({
            name: z.string(),
            content: z.string(),
        })),
    }),
})

export const chatCollection = new Collection({
    db,
    store: 'chats',
    version: 1,
    schema: makeSchema({
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
    migrations: {
        1: (doc) => {
            if (!Array.isArray(doc.messages)) throw new Error('Invalid messages array')
            doc.messages.forEach((msg) => {
                if (msg.type === 'model') {
                    msg.type = 'assistant'
                }
            })
            return doc
        },
    },
})
export type Chat = z.infer<typeof chatCollection.schema>
export type Message = Chat['messages'][0]

export const templateCollection = new Collection({
    db,
    store: 'templates',
    version: 0,
    schema: makeSchema({
        name: z.string().min(1, {error: 'Name cannot be empty'}),
        template: z.string(),
    }),
})

export const generationPresetCollection = new Collection({
    db,
    store: 'generationPresets',
    version: 0,
    schema: makeSchema({
        name: z.string().min(1, {error: 'Name cannot be empty'}),
        maxTokens: z.number().optional(),
        temperature: z.number().optional(),
        seed: z.number().optional(),
        topK: z.number().optional(),
        topP: z.number().optional(),
        minP: z.number().optional(),
        frequencyPenalty: z.number().optional(),
        presencePenalty: z.number().optional(),
    }),
})

type Collections = Record<string, Collection<z.ZodObject>>
export const collections: Collections = {
    characters: characterCollection,
    lore: loreCollection,
    chats: chatCollection,
    templates: templateCollection,
    generationPresets: generationPresetCollection,
}

await fixtureData(db)
