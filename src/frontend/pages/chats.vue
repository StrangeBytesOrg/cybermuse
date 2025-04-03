<script lang="ts" setup>
import {ref, computed} from 'vue'
import {chatCollection, characterCollection, type Chat} from '@/db'
import {PencilSquareIcon} from '@heroicons/vue/24/outline'
import Thumbnail from '@/components/thumbnail.vue'

const showArchivedChats = ref(false)
const allChats = await chatCollection.toArray()
const characters = await characterCollection.toArray()
const characterMap = Object.fromEntries(characters.map((character) => [character.id, character]))
const orderBy = ref('newest-update')

const chats = computed(() => {
    const filteredChats = showArchivedChats.value ? allChats : allChats.filter(chat => !chat.archived)

    return filteredChats.sort((a, b) => {
        if (orderBy.value === 'newest-update') return b.lastUpdate - a.lastUpdate
        if (orderBy.value === 'oldest-update') return a.lastUpdate - b.lastUpdate
        if (orderBy.value === 'newest-create') return b.createDate - a.createDate
        if (orderBy.value === 'oldest-create') return a.createDate - b.createDate
        if (orderBy.value === 'most-messages') return b.messages.length - a.messages.length
        return 0
    })
})

const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
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
    <Teleport to="#topbar">
        <RouterLink :to="{name: 'create-chat'}" class="btn btn-sm btn-primary absolute top-2 left-2">New Chat</RouterLink>
    </Teleport>

    <div class="flex flex-row">
        <div class="flex flex-col">
            <select v-model="orderBy" class="select w-full">
                <option value="newest-update">Recently Updated</option>
                <option value="oldest-update">Oldest Updated</option>
                <option value="newest-create">Recently Created</option>
                <option value="oldest-create">Oldest Created</option>
                <option value="most-messages">Most Messages</option>
            </select>
        </div>
        <div class="flex ml-5">
            <label class="label cursor-pointer">
                <span class="label-text mr-2">Show archived</span>
                <input v-model="showArchivedChats" type="checkbox" class="toggle toggle-primary" />
            </label>
        </div>
    </div>

    <div v-if="chats.length" class="flex flex-col mt-2">
        <router-link
            :to="{name: 'chat', params: {id: chat.id}}"
            v-for="chat in chats"
            :key="chat.id"
            :class="{'outline outline-warning': chat.archived}"
            class="relative p-2 mb-2 max-w-96 bg-base-200 rounded-md hover:outline outline-primary">
            <div class="text-lg font-bold">
                {{ formatTitle(chat) }}
            </div>
            <div class="text-sm">Updated: {{ formatDate(chat.lastUpdate) }}</div>
            <div class="text-sm">Created: {{ formatDate(chat.createDate) }}</div>
            <div class="text-sm">Messages: {{ chat.messages.length }}</div>
            <div class="avatar-group mt-3 -space-x-4 rtl:space-x-reverse">
                <div v-for="character in chat.characters" :key="character" class="avatar">
                    <div class="h-14">
                        <Thumbnail
                            v-if="characterMap[character]?.avatar"
                            :image="characterMap[character].avatar"
                            :width="512"
                            :height="512"
                            :alt="characterMap[character].name"
                        />
                        <img v-else src="../assets/img/placeholder-avatar.webp" alt="placeholder avatar" />
                    </div>
                </div>
            </div>
            <RouterLink :to="`/edit-chat/${chat.id}`" class="btn btn-sm absolute top-2 right-2">
                <PencilSquareIcon class="size-6" />
            </RouterLink>
        </router-link>
    </div>
    <div v-else class="mt-2">No chats yet. Make one to get started.</div>
</template>
