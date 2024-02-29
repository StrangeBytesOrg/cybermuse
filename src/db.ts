import Dexie, {type Table} from 'dexie'

export interface Character {
    id?: number
    name: string
    description: string
}

export interface Chat {
    id?: number
    characterId: number
}

export interface Message {
    id?: number
    chatId: number
    user: string
    text: string
}

export class ChatDatabase extends Dexie {
    characters: Table<Character, number>
    chats: Table<Chat, number>
    messages: Table<Message, number>

    constructor() {
        super('chat-frontend')

        this.version(2).stores({
            characters: '++id, name, description',
            chats: '++id, characterId',
            messages: '++id, chatId, user, text',
        })
        this.characters = this.table('characters')
        this.chats = this.table('chats')
        this.messages = this.table('messages')
    }
}
export const db = new ChatDatabase()
