<script lang="ts" setup>
import {ref} from 'vue'
import {client} from '../api-client'

const chatRes = await client.GET('/api/chats')
const characterRes = await client.GET('/api/characters')
if (!chatRes.data) {
    throw new Error('No chats found')
}
if (!characterRes.data) {
    throw new Error('No characters found')
}

const chats = ref(chatRes.data)
const characterMap = new Map(characterRes.data.map((character) => [character.id, character]))

const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

const deleteChat = async (chatId: number) => {
    await client.POST('/api/delete-chat', {
        body: {
            id: chatId,
        },
    })

    const chatRes = await client.GET('/api/chats')
    chats.value = chatRes.data
}
</script>

<template>
    <div class="px-3">
        <router-link to="/create-chat" class="btn btn-primary mt-3">Create Chat</router-link>

        <div class="flex flex-col">
            <router-link
                :to="`/chat?id=${chat.id}`"
                v-for="chat in chats"
                :key="chat.id"
                class="relative bg-base-200 rounded-md p-2 mt-2 hover:outline outline-primary">
                <div>Created: {{ formatDate(chat.createdAt) }}</div>
                <div class="avatar-group -space-x-4 rtl:space-x-reverse">
                    <div v-for="{characterId} in chat.chatCharacters" :key="characterId" class="avatar">
                        <div class="h-14">
                            <img
                                v-if="characterMap.get(characterId)?.image"
                                :src="characterMap.get(characterId)?.image"
                                alt="Character Image" />
                            <img v-else src="../assets/img/placeholder-avatar.webp" alt="placeholder avatar" />
                        </div>
                    </div>
                </div>
                <button
                    @click.prevent="deleteChat(chat.id)"
                    class="btn btn-error btn-square btn-sm absolute top-2 right-2">
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
    </div>
</template>
