<script lang="ts" setup>
import {reactive} from 'vue'
import {chatCollection, characterCollection} from '@/db'
import type {Chat} from '@/db'
import TopBar from '@/components/top-bar.vue'

const chats = reactive(await chatCollection.find({limit: 100}))
const characters = reactive(await characterCollection.find())
const characterMap = Object.fromEntries(characters.map((character) => [character._id, character]))

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const formatTitle = (chat: Chat) => {
    if (chat.name) return chat.name
    return chat.characters.map((character) => characterMap[character]?.name || 'Unknown').join(' ')
}
</script>

<template>
    <TopBar title="Chats">
        <RouterLink to="/create-chat" class="btn btn-sm btn-primary ml-auto">New Chat +</RouterLink>
    </TopBar>

    <div class="flex flex-col m-2">
        <router-link
            :to="{name: 'chat', params: {id: chat._id}}"
            v-for="chat in chats"
            :key="chat._id"
            class="relative p-2 mb-2 max-w-96 bg-base-200 rounded-md hover:outline outline-primary">
            <div class="text-lg font-bold">
                {{ formatTitle(chat) }}
            </div>
            <div class="text-sm">{{ formatDate(chat.createDate) }}</div>
            <div class="avatar-group mt-3 -space-x-4 rtl:space-x-reverse">
                <div v-for="character in chat.characters" :key="character" class="avatar">
                    <div class="h-14">
                        <img
                            v-if="characterMap[character]?.image"
                            :src="`/avatars/${characterMap[character]?.image}`"
                            alt="Character Image" />
                        <img v-else src="../assets/img/placeholder-avatar.webp" alt="placeholder avatar" />
                    </div>
                </div>
            </div>
            <RouterLink :to="`/edit-chat/${chat._id}`" class="btn btn-neutral btn-sm absolute top-2 right-2">
                <!-- prettier-ignore -->
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
            </RouterLink>
        </router-link>
    </div>
</template>
