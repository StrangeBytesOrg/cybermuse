<script lang="ts" setup>
import {useRoute, useRouter} from 'vue-router'
import {useToastStore} from '@/store'
import {db} from '@/db'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const chatId = route.params.id
if (!chatId || Array.isArray(chatId)) {
    router.push({name: 'chats'})
    throw new Error('Invalid chat ID')
}

const chat = await db.chats.get(chatId)
const characters = await db.characters.toArray()
if (!chat) {
    router.push({name: 'chats'})
    throw new Error('Chat not found')
}

const updateChat = async () => {
    await db.chats.update(chatId, chat)
    toast.success('Updated')
    router.push({name: 'chats'})
}

const archiveChat = async () => {
    await db.chats.update(chatId, {archived: true})
    router.push({name: 'chats'})
}

const deleteChat = async () => {
    await db.chats.delete(chatId)
    router.push({name: 'chats'})
}
</script>

<template>
    <div class="flex flex-col p-3 bg-base-200 rounded-lg">
        <label class="w-full max-w-64">
            <input
                type="text"
                v-model="chat.name"
                placeholder="Chat name (optional)"
                class="input"
            />
        </label>

        <!-- Characters -->
        <div class="mt-3">
            <div class="text-lg">Characters:</div>
            <div v-for="character in chat.characters" :key="character">
                {{ characters.find((c) => c.id === character)?.name }}
            </div>

            <div class="text-lg">User Character:</div>
            {{ characters.find((c) => c.id === chat.userCharacter)?.name }}
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
            <button @click.prevent="archiveChat" class="btn btn-warning ml-3">Archive</button>
            <button onclick="delete_confirm.showModal()" class="btn btn-error ml-3">Delete</button>
        </div>
    </div>

    <dialog id="delete_confirm" class="modal">
        <div class="modal-box">
            <h3 class="text-lg font-bold">Are you sure you want to delete this chat?</h3>
            <p class="pt-4">This cannot be undone.</p>
            <div class="modal-action">
                <form method="dialog">
                    <button class="btn">Cancel</button>
                </form>
                <button class="btn btn-error" @click="deleteChat">Delete</button>
            </div>
        </div>
    </dialog>
</template>
