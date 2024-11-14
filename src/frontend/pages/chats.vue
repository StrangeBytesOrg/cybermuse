<script lang="ts" setup>
import {reactive} from 'vue'
import {chatCollection, characterCollection} from '@/db'
import type {Chat} from '@/db'
import TopBar from '@/components/top-bar.vue'
import {PencilSquareIcon} from '@heroicons/vue/24/outline'

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
                <PencilSquareIcon class="size-6" />
            </RouterLink>
        </router-link>
    </div>
</template>
