import Dexie, {type EntityTable} from 'dexie'

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
    characters: 'id,name,type',
    lore: 'id',
    chats: 'id,lastUpdate',
    templates: 'id',
    generationPresets: 'id',
})

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
