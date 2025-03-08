import Dexie, {type EntityTable} from 'dexie'

const dbName = 'cybermuse'

interface Character {
    id: string
    lastUpdate: number
    name: string
    type: 'user' | 'character'
    description: string
    firstMessage?: string
    avatar?: File
}

interface Lore {
    id: string
    lastUpdate: number
    name: string
    entries: {
        name: string
        content: string
    }[]
}

interface Chat {
    id: string
    lastUpdate: number
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
    name: string
    template: string
}

interface GenerationPreset {
    id: string
    lastUpdate: number
    name: string
    maxTokens: number
    temperature: number
    seed?: number
    topK?: number
    topP?: number
    minP?: number
    repeatPenalty?: {
        penalty?: number
        presencePenalty?: number
        frequencyPenalty?: number
        lastTokens?: number
        penalizeNewLine?: boolean
    }
}

interface User {
    id: string
    lastUpdate: number
    name: string
    generatePresetId: string
    promptTemplateId: string
}

const db = new Dexie(dbName) as Dexie & {
    characters: EntityTable<Character>
    lore: EntityTable<Lore>
    chats: EntityTable<Chat>
    templates: EntityTable<Template>
    generationPresets: EntityTable<GenerationPreset>
    users: EntityTable<User>
}

db.version(1).stores({
    characters: 'id, name, type',
    lore: 'id',
    chats: 'id',
    templates: 'id',
    generationPresets: 'id',
    users: 'id',
})

export {db}
export type {Character, Chat}
export type Message = Chat['messages'][0]
