import {defineStore} from 'pinia'
import {toRaw} from 'vue'
import {db, type Chat} from '@/db'

export const useChatStore = defineStore('chat', {
    state: () => {
        return {chat: {} as Chat}
    },
    actions: {
        async getChat(chatId: string) {
            this.chat = await db.chats.get(chatId)
        },
        async save() {
            this.chat.lastUpdate = Date.now()
            await db.chats.put(toRaw(this.chat))
        },
        async updateMessage(index: number, content: string) {
            const message = this.chat.messages[index]
            if (message) {
                message.content[message.activeIndex] = content
                await this.save()
            }
        },
        async deleteMessage(index: number) {
            this.chat.messages.splice(index, 1)
            await this.save()
        },
        async swipeLeft(index: number) {
            const message = this.chat.messages[index]
            if (message && message.activeIndex > 0) {
                message.activeIndex -= 1
                await this.save()
            }
        },
        async swipeRight(index: number) {
            const message = this.chat.messages[index]
            if (message && message.activeIndex < message.content.length - 1) {
                message.activeIndex += 1
                await this.save()
            }
        },
    },
})
