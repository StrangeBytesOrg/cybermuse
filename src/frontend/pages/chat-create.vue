<script lang="ts" setup>
import {ref, computed} from 'vue'
import {useRouter} from 'vue-router'
import Handlebars from 'handlebars'
import {db, chatCollection, characterCollection, loreCollection} from '@/db'
import type {Message} from '@/db'

const router = useRouter()
const selectedCharacters = ref<string[]>([])
const selectedLore = ref<string[]>([])
const userCharacter = ref('default-user-character')
const chatName = ref('')

const characters = await characterCollection.find()
const lore = await loreCollection.find()
const avatars: Record<string, string> = {}

for (const character of characters) {
    if (character._attachments) {
        const avatar = (await db.getAttachment(character._id, 'avatar')) as Blob
        avatars[character._id] = URL.createObjectURL(avatar)
    }
}

const createChat = async () => {
    // If characters have a first message, add it to the chat
    const userName = characters.find((c) => c._id === userCharacter.value)?.name
    const messages: Message[] = []
    selectedCharacters.value.forEach(async (characterId) => {
        const character = characters.find((c) => c._id === characterId)
        if (character?.firstMessage) {
            // Parse firstMessage template
            const hbTemplate = Handlebars.compile(character.firstMessage)
            const content = hbTemplate({
                char: character.name,
                user: userName,
            })
            messages.push({
                id: Math.random().toString(36).slice(2),
                type: 'model',
                content: [content],
                activeIndex: 0,
                characterId: character._id,
            })
        }
    })

    const {id} = await chatCollection.put({
        name: chatName.value,
        userCharacter: userCharacter.value,
        characters: selectedCharacters.value,
        lore: selectedLore.value,
        createDate: new Date().toISOString(),
        messages,
    })

    router.push({name: 'chat', params: {id}})
}

const setSelected = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.checked) {
        selectedCharacters.value.push(target.value)
    } else {
        selectedCharacters.value = selectedCharacters.value.filter((id) => id !== target.value)
    }
}

const setSelectedLore = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.checked) {
        selectedLore.value.push(target.value)
    } else {
        selectedLore.value = selectedLore.value.filter((id) => id !== target.value)
    }
}

const notUserCharacters = computed(() => {
    return characters.filter((character) => character.type !== 'user')
})

const userCharacters = computed(() => {
    return characters.filter((character) => character.type === 'user')
})
</script>

<template>
    <main class="p-2">
        <!-- Characters -->
        <h2 class="text-xl font-bold">Characters</h2>
        <div class="divider mt-0 mb-1"></div>
        <div class="flex flex-col">
            <template v-if="notUserCharacters.length">
                <div
                    v-for="character in notUserCharacters"
                    :key="character._id"
                    class="flex h-24 p-2 mb-2 rounded-lg bg-base-200 relative hover:outline outline-primary">
                    <div class="avatar w-20 h-20">
                        <img v-if="avatars[character._id]" :src="avatars[character._id]" class="rounded-lg" />
                        <img v-else src="../assets/img/placeholder-avatar.webp" class="rounded-lg" />
                    </div>
                    <div class="text-lg ml-2">{{ character.name }}</div>
                    <label class="absolute w-full h-full cursor-pointer">
                        <input
                            type="checkbox"
                            :value="character._id"
                            :checked="selectedCharacters.includes(character._id)"
                            @change="setSelected"
                            class="checkbox absolute top-2 right-4" />
                    </label>
                </div>
            </template>
            <template v-else>
                <div class="font-bold text-lg pt-3 pb-5">No characters found. Create one on the characters page.</div>
            </template>
        </div>

        <!-- User Character -->
        <h2 class="text-xl font-bold">User Character</h2>
        <div class="divider mt-0 mb-1"></div>
        <select v-model="userCharacter" class="select bg-base-200">
            <option v-for="character in userCharacters" :key="character._id" :value="character._id">
                {{ character.name }}
            </option>
        </select>

        <!-- Lore -->
        <div v-if="lore.length" class="w-full">
            <h2 class="text-xl font-bold mt-5">Lore</h2>
            <div class="divider mt-0 mb-1"></div>
            <div class="flex flex-col">
                <div
                    v-for="loreBook in lore"
                    :key="loreBook._id"
                    class="flex h-24 p-2 mb-2 rounded-lg bg-base-200 relative hover:outline outline-primary">
                    <div class="text-lg ml-2">{{ loreBook.name }}</div>
                    <label class="absolute w-full h-full cursor-pointer">
                        <input
                            type="checkbox"
                            :value="loreBook._id"
                            @change="setSelectedLore"
                            class="checkbox absolute top-2 right-4" />
                    </label>
                </div>
            </div>
        </div>

        <!-- Chat Name -->
        <h2 class="text-xl font-bold mt-5">Chat Name</h2>
        <div class="divider mt-0 mb-1"></div>
        <input
            type="text"
            placeholder="(optional)"
            v-model="chatName"
            class="input input-bordered focus:outline-none focus:border-primary" />

        <div class="flex flex-row mt-5">
            <button class="btn btn-primary" @click="createChat">Create Chat</button>
            <button class="btn btn-error ml-3" @click="router.back">Cancel</button>
        </div>
    </main>
</template>
