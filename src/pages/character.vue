<script lang="ts" setup>
import {db} from '../db'

const route = useRoute()
const characterId = Number(route.query.id)
const character = await db.characters.get(characterId)
const chats = await db.chats.where('characterId').equals(characterId).toArray()

const deleteCharacter = async () => {
    await db.characters.delete(characterId)
    await navigateTo('/characters')
}

const createChat = async () => {
    const chatId = await db.chats.add({characterId})
    await navigateTo(`/chat?id=${chatId}`)
}
</script>

<template>
    <div>
        <h1>Character</h1>
        Name: {{ character.name }}
        <br />
        Description: {{ character.description }}
        <br />
        <!-- <router-link :to="`/chat?id=${characterId}`" class="btn btn-primary">Chat</router-link> -->
        <button class="btn btn-primary" @click="createChat()">New Chat</button>
        <button class="btn btn-error" @click="deleteCharacter()">Delete</button>

        <h2>Chats</h2>
        <div v-for="chat in chats" :key="chat.id">
            <router-link :to="`/chat?id=${chat.id}`" class="btn btn-primary">Chat Id: {{ chat.id }}</router-link>
        </div>
    </div>
</template>
