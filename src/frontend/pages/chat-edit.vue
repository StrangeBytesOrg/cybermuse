<script lang="ts" setup>
import {useRoute, useRouter} from 'vue-router'
import {useToastStore} from '@/store'
import {chatCollection, characterCollection} from '@/db'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const chatId = route.params.id
if (!chatId || Array.isArray(chatId)) {
    router.push({name: 'chats'})
    throw new Error('Invalid chat ID')
}

const chat = await chatCollection.findById(chatId)
const characters = await characterCollection.find()
if (!chat) {
    router.push({name: 'chats'})
    throw new Error('Chat not found')
}

const updateChat = async () => {
    await chatCollection.put(chat)
    toast.success('Updated')
    router.push({name: 'chats'})
}

const deleteChat = async () => {
    await chatCollection.removeById(chatId)
    router.push({name: 'chats'})
}
</script>

<template>
    <main class="flex flex-col p-3 bg-base-200 rounded-lg">
        <label class="form-control w-full max-w-64">
            <input
                type="text"
                v-model="chat.name"
                placeholder="Chat name (optional)"
                class="input input-bordered focus:outline-none focus:border-primary"
            />
        </label>

        <!-- Characters -->
        <div class="mt-3">
            <div class="text-lg">Characters:</div>
            <div v-for="character in chat.characters" :key="character">
                {{ characters.find((c) => c._id === character)?.name }}
            </div>

            <div class="text-lg">User Character:</div>
            {{ characters.find((c) => c._id === chat.userCharacter)?.name }}
        </div>

        <!-- Lore -->
        <div class="mt-3">
            <div class="text-lg">Lore</div>
            <div v-for="lore in chat.lore" :key="lore">
                {{ lore }}
            </div>
        </div>

        <div class="divider mb-3"></div>
        <div>
            <button @click.prevent="updateChat" class="btn btn-primary">Update</button>
            <button @click.prevent="deleteChat" class="btn btn-error ml-3">Delete</button>
        </div>
    </main>
</template>
