<script lang="ts" setup>
import {ref, computed} from 'vue'
import {useRouter} from 'vue-router'
import {chatCollection, characterCollection, loreCollection} from '@/db'
import TopBar from '@/components/top-bar.vue'

const router = useRouter()
const selectedCharacters = ref<string[]>([])
const selectedLore = ref<string[]>([])
const userCharacter = ref()
const chatName = ref('')

const characters = await characterCollection.find()
const lore = await loreCollection.find()

const createChat = async () => {
    const {id} = await chatCollection.put({
        _id: Math.random().toString(36).slice(2), // TODO implement a more general document ID generation method
        name: chatName.value,
        userCharacter: userCharacter.value,
        characters: selectedCharacters.value,
        lore: selectedLore.value,
        createDate: new Date().toISOString(),
        messages: [],
    })
    router.push(`/chat?id=${id}`)
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
    <TopBar title="Create Chat" back />

    <div class="p-2">
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
                        <img v-if="character.image" :src="`/avatars/${character.image}`" class="rounded-lg" />
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
        <label class="form-control w-full">
            <div class="label"><span class="label-text font-bold">Chat Name</span></div>
            <input
                type="text"
                placeholder="(optional)"
                v-model="chatName"
                class="input input-bordered focus:outline-none focus:border-primary" />
        </label>

        <div class="flex flex-row mt-5">
            <button class="btn btn-primary" @click="createChat">Create Chat</button>
            <button class="btn btn-error ml-3" @click="router.push('/chats')">Cancel</button>
        </div>
    </div>
</template>
