<script lang="ts" setup>
import {ref, onBeforeMount} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {db} from '../db'

const route = useRoute()
const router = useRouter()
const characterId = Number(route.query.id)
const character = ref({})
const chats = ref([])

onBeforeMount(async () => {
    character.value = await db.characters.get(characterId)
    chats.value = await db.chats.where('characterId').equals(characterId).toArray()

    // const wat = await db.chats.get(2)
    // if (!wat) {
    //     console.log('wat not found')
    // } else {
    //     console.log(wat)
    //     wat.messages.push({text: 'foo', userType: 'wat'})
    //     await db.chats.put(wat)
    // }
})

const updateCharacter = async () => {
    await db.characters.update(characterId, character.value)
}

const deleteCharacter = async () => {
    await db.characters.delete(characterId)
    await router.push('/characters')
}

const createChat = async () => {
    const chat = {characterId, createdAt: Date.now(), updatedAt: Date.now(), messages: []}
    const chatId = await db.chats.add(chat)
    await router.push(`/chat?id=${chatId}`)
}

const deleteChat = async (chatId) => {
    await db.chats.delete(chatId)
    chats.value = await db.chats.where('characterId').equals(characterId).toArray()
}
</script>

<template>
    <div class="flex flex-col p-5">
        <input
            type="text"
            v-model="character.name"
            class="input input-bordered max-w-80"
            placeholder="Character Name" />
        <textarea
            class="textarea textarea-bordered mt-5"
            v-model="character.description"
            placeholder="Description"></textarea>

        <div class="flex flex-row mt-5">
            <button class="btn btn-primary" @click="updateCharacter()">Update</button>
            <button class="btn btn-error ml-5" @click="deleteCharacter()">Delete</button>
        </div>

        <div class="card bg-base-200 mt-5 p-5">
            <h2 class="text-xl">Chats</h2>
            <div class="divider"></div>
            <button class="btn btn-primary max-w-28" @click="createChat()">New Chat</button>

            <router-link
                :to="`/chat?id=${chat.id}`"
                v-for="chat in chats"
                :key="chat.id"
                class="mt-5 px-3 py-2 bg-base-100 rounded-md flex">
                <!-- <router-link :to="`/chat?id=${chat.id}`" class="btn btn-primary">Chat Id: {{ chat.id }}</router-link> -->
                <p>Created: {{ chat.createdAt }}</p>
                <p>Last message: {{}}</p>
                <button class="btn btn-error ml-auto" @click.prevent="deleteChat(chat.id)">Delete</button>
            </router-link>
        </div>
    </div>
</template>
