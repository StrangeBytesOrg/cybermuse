import {Collection} from '@strangebytes/pouchdb-orm'
import PouchDB from 'pouchdb-browser'
import find from 'pouchdb-find'
import {z} from 'zod'

const dbName = 'cybermuse'
export const db = new PouchDB(dbName, {
    revs_limit: 10, // TODO verify if auto-compaction is necessary with revs_limit
})
PouchDB.plugin(find)

const baseSchema = z.object({
    _id: z.string(),
    _rev: z.string().optional(),
    _attachments: z
        .record(
            z.object({
                content_type: z.string(),
                data: z.instanceof(File).optional(),
                stub: z.boolean().optional(),
                digest: z.string().optional(),
                length: z.number().optional(),
                revpos: z.number().optional(),
            }),
        )
        .optional(),
})

/** Character */
const characterSchema = baseSchema.extend({
    _id: z.string().default(() => `character-${Math.random().toString(36).slice(2)}`),
    name: z.string().min(1, {message: 'Character name cannot be empty'}),
    type: z.union([z.literal('user'), z.literal('character')]),
    description: z.string().min(1, {message: 'Character description cannot be empty'}),
    firstMessage: z.string().optional(),
})
export const characterCollection = new Collection(db, 'character', characterSchema)

/** Lore */
const loreSchema = baseSchema.extend({
    _id: z.string().default(() => `lore-${Math.random().toString(36).slice(2)}`),
    name: z.string().min(1, {message: 'Lorebook name cannot be empty'}),
    entries: z.array(
        z.object({
            name: z.string().min(1, {message: 'Entry name cannot be empty'}),
            content: z.string(),
        }),
    ),
})
export const loreCollection = new Collection(db, 'lore', loreSchema)

/** Chat */
const chatSchema = baseSchema.extend({
    _id: z.string().default(() => `chat-${Math.random().toString(36).slice(2)}`),
    name: z.string(),
    userCharacter: z.string({message: 'A user character is required'}),
    characters: z.array(z.string()).min(1, {message: 'At least one character is required'}),
    lore: z.array(z.string()),
    createDate: z.string().datetime(),
    messages: z.array(
        z.object({
            id: z.string(),
            characterId: z.string(),
            type: z.union([z.literal('user'), z.literal('model'), z.literal('system')]),
            content: z.array(z.string()),
            activeIndex: z.number(),
        }),
    ),
    archived: z.boolean().default(false),
})
export const chatCollection = new Collection(db, 'chat', chatSchema)
export type Chat = z.infer<typeof chatSchema>
export type Message = z.infer<typeof chatSchema>['messages'][0]

/** Template */
const templateSchema = baseSchema.extend({
    _id: z.string().default(() => `template-${Math.random().toString(36).slice(2)}`),
    name: z.string().min(1, {message: 'Template name cannot be empty'}),
    template: z.string().min(1, {message: 'Template content cannot be empty'}),
})
export const templateCollection = new Collection(db, 'template', templateSchema)

/** Generation Preset */
const generationPresetSchema = baseSchema.extend({
    _id: z.string().default(() => `generationPreset-${Math.random().toString(36).slice(2)}`),
    name: z.string().min(1, {message: 'Generation Preset name cannot be empty'}),
    maxTokens: z.number({message: 'Max Tokens is required'}).positive().int(),
    temperature: z.number().nonnegative(),
    seed: z.number().nonnegative().int().optional(),
    topK: z.number().int().optional(),
    topP: z.number().optional(),
    minP: z.number().optional(),
    repeatPenalty: z.object({
        penalty: z.number().optional(),
        presencePenalty: z.number().optional(),
        frequencyPenalty: z.number().optional(),
        lastTokens: z.number().optional(),
        penalizeNewLine: z.boolean().optional(),
    }),
})
export const generationPresetCollection = new Collection(db, 'generationPreset', generationPresetSchema)

/** User */
const userSchema = baseSchema.extend({
    name: z.string(),
    generatePresetId: z.string(),
    promptTemplateId: z.string(),
})
export const userCollection = new Collection(db, 'user', userSchema)
