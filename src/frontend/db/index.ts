import {Collection} from '@strangebytes/pouchdb-orm'
import PouchDB from 'pouchdb'
import find from 'pouchdb-find'
import {z} from 'zod'

const dbName = 'devdb'
const db = new PouchDB(dbName)
PouchDB.plugin(find)

const baseSchema = z.object({
    _id: z.string(),
    _rev: z.string().optional(),
})

/** Character */
const characterSchema = baseSchema.extend({
    name: z.string(),
    type: z.union([z.literal('user'), z.literal('character')]),
    description: z.string(),
    firstMessage: z.string().optional(),
    image: z.string().optional(),
})
export const characterCollection = new Collection(db, 'character', characterSchema)

/** Lore */
const loreSchema = baseSchema.extend({
    name: z.string(),
    entries: z.array(
        z.object({
            name: z.string(),
            content: z.string(),
        }),
    ),
})
export const loreCollection = new Collection(db, 'lore', loreSchema)

/** Chat */
const chatSchema = baseSchema.extend({
    name: z.string(),
    userCharacter: z.string(),
    characters: z.array(z.string()),
    lore: z.array(z.string()),
    messages: z.array(
        z.object({
            characterId: z.string(),
            type: z.union([z.literal('user'), z.literal('model'), z.literal('system')]),
            content: z.array(z.string()),
            activeIndex: z.number(),
        }),
    ),
})
export const chatCollection = new Collection(db, 'chat', chatSchema)

/** Template */
const templateSchema = baseSchema.extend({
    name: z.string(),
    template: z.string(),
})
export const templateCollection = new Collection(db, 'template', templateSchema)

/** Generation Preset */
const generationPresetSchema = baseSchema.extend({
    name: z.string(),
    context: z.number(),
    maxTokens: z.number(),
    temperature: z.number(),
    seed: z.number(),
    topK: z.number().optional(),
    topP: z.number().optional(),
    minP: z.number().optional(),
    repeatPenalty: z.number().optional(),
    repeatLastN: z.number().optional(),
    penalizeNL: z.boolean().optional(),
    presencePenalty: z.number().optional(),
    frequencyPenalty: z.number().optional(),
})
export const generationPresetCollection = new Collection(db, 'generationPreset', generationPresetSchema)

/** User */
const userSchema = baseSchema.extend({
    name: z.string(),
    generatePreset: z.string(),
    promptTemplate: z.string(),
})
export const userCollection = new Collection(db, 'user', userSchema)
