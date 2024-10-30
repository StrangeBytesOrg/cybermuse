<script lang="ts" setup>
import {ref} from 'vue'
import {client} from '../api-client'

const chats = ref(await client.chats.getAll.query())
type Chat = (typeof chats.value)[0]

// Filter out chats with no characters
chats.value = chats.value.filter((chat) => chat.characters.length > 1)

const formatDate = (dateString: string) => {
    return new Date(dateString + ' UTC').toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const formatTitle = (chat: Chat) => {
    if (chat.name) return chat.name
    return chat.characters
        .filter(({character}) => character.type === 'character')
        .map(({character}) => character.name)
        .join(' ')
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
            <div class="text-lg font-bold">
                {{ formatTitle(chat) }}
            </div>
            <div class="text-sm">{{ formatDate(chat.createdAt) }}</div>
            <div class="avatar-group mt-3 -space-x-4 rtl:space-x-reverse">
                <div v-for="character in chat.characters" :key="character.id" class="avatar">
                    <div class="h-14">
                        <img
                            v-if="character.character.image"
                            :src="`/avatars/${character.character.image}`"
                            alt="Character Image" />
                        <img v-else src="../assets/img/placeholder-avatar.webp" alt="placeholder avatar" />
                    </div>
                </div>
            </div>
            <RouterLink :to="`/edit-chat/${chat.id}`" class="btn btn-neutral btn-sm absolute top-2 right-2">
                <!-- prettier-ignore -->
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
            </RouterLink>
        </router-link>
    </div>
</template>
