<script lang="ts" setup>
import {ref, toRaw, computed} from 'vue'
import {useRouter} from 'vue-router'
import {db} from '../db'

const router = useRouter()
const selectedCharacters = ref<number[]>([])
const characters = await db.characters.toArray()
const nonSelectedCharacters = computed(() => {
    return characters.filter((character) => !selectedCharacters.value.includes(character.id))
})

const createChat = async () => {
    const chat = await db.chats.add({
        createdAt: Date.now(),
        updatedAt: Date.now(),
        characters: toRaw(selectedCharacters.value),
    })
    console.log(chat)
}

// const createChat = async (characterId: number) => {
//     const character = await db.characters.get(characterId)
//     const chatId = await db.chats.add({characterId, createdAt: Date.now(), updatedAt: Date.now()})
//     if (character?.firstMessage) {
//         await db.messages.add({
//             chatId,
//             user: character.name,
//             userType: 'assistant',
//             text: character.firstMessage,
//             altHistory: [],
//             activeMessage: 0,
//             pending: false,
//         })
//     }
//     await router.push(`/chat?id=${chatId}`)
// }

const selectCharacter = (characterId: number) => {
    selectedCharacters.value.push(characterId)
}

const deselectCharacter = (characterId: number) => {
    selectedCharacters.value = selectedCharacters.value.filter((id) => id !== characterId)
}
</script>

<template>
    <div class="p-2">
        <h2 class="text-xl font-bold">Characters</h2>
        <div class="divider mt-0"></div>
        <div class="flex flex-row">
            <div
                v-for="character in nonSelectedCharacters"
                :key="character.id"
                @click="selectCharacter(character.id)"
                class="w-40 h-40 mr-3 rounded-lg hover:outline outline-primary">
                <div class="avatar w-40 h-40">
                    <img :src="character.image" class="rounded-lg" />
                </div>
            </div>
        </div>

        <h2 class="text-xl font-bold mt-3">Selected Characters</h2>
        <div class="divider mt-0"></div>
        <div class="flex flex-row">
            <div
                v-for="characterId in selectedCharacters"
                :key="characterId"
                @click="deselectCharacter(characterId)"
                class="w-40 h-40 mr-3 rounded-lg hover:outline outline-primary">
                <div class="avatar w-40 h-40">
                    <img
                        :src="characters.find((character) => character.id === characterId)?.image"
                        class="rounded-lg" />
                </div>
            </div>
        </div>

        <div class="flex flex-row mt-3">
            <button class="btn btn-primary" @click="createChat">Create Chat</button>
            <button class="btn btn-error ml-3" @click="router.push('/chats')">Cancel</button>
        </div>
    </div>
</template>
