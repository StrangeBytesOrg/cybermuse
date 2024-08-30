<script lang="ts" setup>
import {ref} from 'vue'
import {useToast} from 'vue-toastification'
import {client} from '../api-client'

const toast = useToast()
const {data} = await client.GET('/chats')
const chats = ref(data?.chats || [])

const formatDate = (dateString: string) => {
    return new Date(dateString + ' UTC').toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const deleteChat = async (chatId: number) => {
    const {error} = await client.POST('/delete-chat/{id}', {
        params: {path: {id: String(chatId)}},
    })

    if (error) {
        console.error(error)
        toast.error('Failed to delete chat')
    } else {
        const chatRes = await client.GET('/chats')
        chats.value = chatRes.data?.chats || []
    }
}
</script>

<template>
    <div class="flex flex-row p-3 bg-base-300">
        <h1 class="text-xl">Chats</h1>
        <RouterLink to="/create-chat" class="btn btn-sm btn-primary ml-auto">New Chat +</RouterLink>
    </div>

    <div class="flex flex-col m-2">
        <router-link
            :to="`/chat?id=${chat.id}`"
            v-for="chat in chats"
            :key="chat.id"
            class="relative p-2 mb-2 max-w-96 bg-base-200 rounded-md hover:outline outline-primary">
            <div>Created: {{ formatDate(chat.createdAt) }}</div>
            <div class="avatar-group -space-x-4 rtl:space-x-reverse">
                <div v-for="character in chat.characters" :key="character.id" class="avatar">
                    <div class="h-14">
                        <img v-if="character.character.image" :src="character.character.image" alt="Character Image" />
                        <img v-else src="../assets/img/placeholder-avatar.webp" alt="placeholder avatar" />
                    </div>
                </div>
            </div>
            <button @click.prevent="deleteChat(chat.id)" class="btn btn-error btn-square btn-sm absolute top-2 right-2">
                <!-- prettier-ignore -->
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
            </button>
        </router-link>
    </div>

    <!--<div v-for="(character, characterIndex) in characters" :key="characterIndex" class="mt-5">
            <div class="flex flex-row">
                <div class="avatar">
                    <div class="w-16 h-16 rounded-xl">
                        <img v-if="character.image" :src="character.image" alt="Character Image" />
                        <img v-else src="../assets/img/placeholder-avatar.webp" alt="placeholder avatar" />
                    </div>
                </div>
                <h3 class="text-lg mt-auto ml-3">{{ character.name }}</h3>
                <!~~ <button @click="createChat(character.id)" class="btn btn-primary mt-auto ml-auto">New Chat</button> ~~>
            </div>
            <div class="divider mt-0 mb-0" />
            <div class="flex flex-col">
                <router-link
                    v-for="(chat, chatIndex) in filteredChats(character)"
                    :to="`/chat?id=${chat.id}`"
                    :key="chatIndex"
                    class="relative bg-base-200 rounded-md p-2 mt-2 hover:outline outline-primary">
                    <div class="flex flex-col">
                        <p>Created: {{ formatDate(chat.createdAt) }}</p>
                        <p>Updated: {{ formatDate(chat.updatedAt) }}</p>
                    </div>
                    <button
                        @click.prevent="deleteChat(chat.id)"
                        class="btn btn-error btn-square btn-sm absolute top-2 right-2">
                        <!~~ prettier-ignore ~~>
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    </button>
                </router-link>
            </div>
        </div>-->
</template>
