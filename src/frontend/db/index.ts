import Dexie, {type EntityTable} from 'dexie'
import {Collection} from '@/lib/dexie-orm'
import z from 'zod'

const dbName = 'cybermuse'

interface Character {
    id: string
    lastUpdate: number
    deleted?: number
    name: string
    type: 'user' | 'character'
    description: string
    firstMessage?: string
    avatar?: string
}

interface Lore {
    id: string
    lastUpdate: number
    deleted?: number
    name: string
    entries: {
        name: string
        content: string
    }[]
}

interface Chat {
    id: string
    lastUpdate: number
    deleted?: number
    name: string
    userCharacter: string
    characters: string[]
    lore: string[]
    createDate: string
    messages: {
        id: string
        characterId: string
        type: 'user' | 'model' | 'system'
        content: string[]
        activeIndex: number
    }[]
    archived: boolean
}

interface Template {
    id: string
    lastUpdate: number
    deleted?: number
    name: string
    template: string
}

interface GenerationPreset {
    id: string
    lastUpdate: number
    deleted?: number
    name: string
    maxTokens: number
    temperature: number
    seed?: number
    topK?: number
    topP?: number
    minP?: number
    repeatPenalty: {
        penalty?: number
        presencePenalty?: number
        frequencyPenalty?: number
        lastTokens?: number
        penalizeNewLine?: boolean
    }
}

const db = new Dexie(dbName) as Dexie & {
    characters: EntityTable<Character, 'id'>
    lore: EntityTable<Lore, 'id'>
    chats: EntityTable<Chat, 'id'>
    templates: EntityTable<Template, 'id'>
    generationPresets: EntityTable<GenerationPreset, 'id'>
}

db.version(1).stores({
    characters: 'id',
    lore: 'id',
    chats: 'id,lastUpdate',
    templates: 'id',
    generationPresets: 'id',
})

export const characterCollection = new Collection(
    db.characters,
    z.object({
        id: z.string(),
        lastUpdate: z.number(),
        deleted: z.number().optional(),
        name: z.string(),
        type: z.union([z.literal('user'), z.literal('character')]),
        description: z.string(),
        firstMessage: z.string().optional(),
        avatar: z.string().optional(),
    }),
)
export const loreCollection = new Collection(
    db.lore,
    z.object({
        id: z.string(),
        lastUpdate: z.number(),
        deleted: z.number().optional(),
        name: z.string(),
        entries: z.array(z.object({
            name: z.string(),
            content: z.string(),
        })),
    }),
)
export const chatCollection = new Collection(
    db.chats,
    z.object({
        id: z.string(),
        lastUpdate: z.number(),
        deleted: z.number().optional(),
        name: z.string(),
        userCharacter: z.string(),
        characters: z.array(z.string()),
        lore: z.array(z.string()),
        createDate: z.string(),
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
    db.templates,
    z.object({
        id: z.string(),
        lastUpdate: z.number(),
        deleted: z.number().optional(),
        name: z.string(),
        template: z.string(),
    }),
)
export const generationPresetCollection = new Collection(
    db.generationPresets,
    z.object({
        id: z.string(),
        lastUpdate: z.number(),
        deleted: z.number().optional(),
        name: z.string(),
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
export type {Character, Chat, GenerationPreset, Lore, Template}
export type Message = Chat['messages'][0]

export const notDeleted = <T extends {deleted?: number}>(doc: T) => !doc.deleted
