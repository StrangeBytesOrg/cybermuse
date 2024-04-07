import Dexie, {type Table} from 'dexie'

export interface Character {
    id?: number
    name: string
    description: string
    firstMessage?: string
    image: string | ArrayBuffer
}

export interface Chat {
    id?: number
    // characterId: number
    characters: number[]
    createdAt: number
    updatedAt: number
}

export interface Message {
    id?: number
    chatId: number
    user: string
    userType: string
    userId: number
    text: string
    pending: boolean
    activeMessage: number
    altHistory: string[]
}

export class ChatDatabase extends Dexie {
    characters: Table<Character, number>
    chats: Table<Chat, number>
    messages: Table<Message, number>

    constructor() {
        super('chat-frontend')

        this.version(1).stores({
            characters: '++id, name, description, firstMessage, image',
            chats: '++id, characters, createdAt, updatedAt',
            messages: '++id, chatId, user, userType, userId, text, pending, activeMessage, altHistory',
        })
        this.characters = this.table('characters')
        this.chats = this.table('chats')
        this.messages = this.table('messages')
    }
}
export const db = new ChatDatabase()
