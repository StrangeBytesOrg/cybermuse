<script lang="ts" setup>
import {reactive, ref, computed} from 'vue'
import {db, type Chat} from '@/db'
import {PencilSquareIcon} from '@heroicons/vue/24/outline'

const showArchivedChats = ref(false)
const allChats = reactive(await db.chats.toArray())
const characters = reactive(await db.characters.toArray())
const characterMap = Object.fromEntries(characters.map((character) => [character.id, character]))

const chats = computed(() => {
    return showArchivedChats.value ? allChats : allChats.filter(chat => !chat.archived)
})

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
    <Teleport to="#topbar">
        <RouterLink to="/create-chat" class="btn btn-sm btn-primary absolute top-2 left-2">New Chat +</RouterLink>
    </Teleport>

    <main class="flex flex-col">
        <div class="flex justify-end mb-4">
            <label class="label cursor-pointer">
                <span class="label-text mr-2">Show archived</span>
                <input v-model="showArchivedChats" type="checkbox" class="toggle toggle-primary" />
            </label>
        </div>

        <template v-if="chats.length">
            <router-link
                :to="{name: 'chat', params: {id: chat.id}}"
                v-for="chat in chats"
                :key="chat.id"
                class="relative p-2 mb-2 max-w-96 bg-base-200 rounded-md hover:outline outline-primary">
                <div class="text-lg font-bold">
                    {{ formatTitle(chat) }}
                </div>
                <div class="text-sm">{{ formatDate(chat.createDate) }}</div>
                <div class="text-sm">Messages: {{ chat.messages.length }}</div>
                <div class="avatar-group mt-3 -space-x-4 rtl:space-x-reverse">
                    <div v-for="character in chat.characters" :key="character" class="avatar">
                        <div class="h-14">
                            <img
                                v-if="characterMap[character]?.avatar"
                                :src="characterMap[character].avatar"
                                alt="Character Image"
                            />
                            <img v-else src="../assets/img/placeholder-avatar.webp" alt="placeholder avatar" />
                        </div>
                    </div>
                </div>
                <RouterLink :to="`/edit-chat/${chat.id}`" class="btn btn-neutral btn-sm absolute top-2 right-2">
                    <PencilSquareIcon class="size-6" />
                </RouterLink>
            </router-link>
        </template>
        <template v-else>No chats yet. Make one to get started.</template>
    </main>
</template>
