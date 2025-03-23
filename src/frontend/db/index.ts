import Dexie, {type EntityTable} from 'dexie'
import {Collection} from '@/lib/dexie-orm'
import z from 'zod'

const dbName = 'cybermuse'
const db = new Dexie(dbName)

db.version(1).stores({
    characters: 'id',
    lore: 'id',
    chats: 'id',
    templates: 'id',
    generationPresets: 'id',
})

export const characterCollection = new Collection(
    db.table('characters'),
    z.object({
        id: z.string().min(1, {message: 'ID cannot be empty'}),
        lastUpdate: z.number(),
        deleted: z.number().optional(),
        name: z.string().min(1, {message: 'Name cannot be empty'}),
        type: z.union([z.literal('user'), z.literal('character')]),
        description: z.string(),
        firstMessage: z.string().optional(),
        avatar: z.string().optional(),
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
        userCharacter: z.string(),
        characters: z.array(z.string()),
        lore: z.array(z.string()),
        createDate: z.number(),
        messages: z.array(z.object({
            id: z.string(),
            characterId: z.string(),
            type: z.union([z.literal('user'), z.literal('model'), z.literal('system')]),
            content: z.array(z.string()),
            activeIndex: z.number(),
        })),
        archived: z.boolean(),
    }),
)
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
        maxTokens: z.number(),
        temperature: z.number(),
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

export {db}
