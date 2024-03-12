import Dexie, {type Table} from 'dexie'

export interface Character {
    id?: number
    name: string
    description: string
}

export interface Chat {
    id?: number
    characterId: number
    createdAt: number
    updatedAt: number
    messages: [
        {
            user: string
            text: string
            createdAt: number
        },
    ]
}

export class ChatDatabase extends Dexie {
    characters: Table<Character, number>
    chats: Table<Chat, number>

    constructor() {
        super('chat-frontend')

        this.version(1).stores({
            characters: '++id, name, description',
            chats: '++id, characterId, createdAt, updatedAt, *messages',
        })
        this.characters = this.table('characters')
        this.chats = this.table('chats')
    }
}
export const db = new ChatDatabase()
