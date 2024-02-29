import {ref} from 'vue'
import {defineStore} from 'pinia'

type Message = {text: string; user: string; userType: 'user' | 'bot'}

export const useMessageStore = defineStore('messages', () => {
    const messages = ref<Message[]>(
        localStorage.getItem('messages') ? JSON.parse(localStorage.getItem('messages')!) : [],
    )

    const update = () => {
        localStorage.setItem('messages', JSON.stringify(messages.value))
    }

    return {
        messages,
        update,
    }
})
