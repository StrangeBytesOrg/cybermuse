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
