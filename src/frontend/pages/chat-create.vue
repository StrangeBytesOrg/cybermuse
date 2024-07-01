<script lang="ts" setup>
import {ref, reactive, computed} from 'vue'
import {useRouter} from 'vue-router'
import {client} from '../api-client'
import {useToast} from 'vue-toastification'

const router = useRouter()
const toast = useToast()
const selectedCharacters = ref<number[]>([])

const {data} = await client.GET('/characters')
const characters = reactive(data?.characters || [])
const userCharacter = ref(1)

const createChat = async () => {
    const {data, error} = await client.POST('/create-chat', {
        body: {
            characters: [...selectedCharacters.value, userCharacter.value],
        },
    })
    if (error) {
        toast.error(error.detail || 'Failed to create chat')
        return
    }
    if (data && data.id) {
        router.push(`/chat?id=${data.id}`)
    }
}

const setSelected = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.checked) {
        selectedCharacters.value.push(Number(target.value))
    } else {
        selectedCharacters.value = selectedCharacters.value.filter((id) => id !== Number(target.value))
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
    <div class="p-2">
        <h2 class="text-xl font-bold">Characters</h2>
        <div class="divider mt-0 mb-1"></div>
        <div class="flex flex-col">
            <template v-if="notUserCharacters.length">
                <div
                    v-for="character in notUserCharacters"
                    :key="character.id"
                    class="flex h-24 p-2 mb-2 rounded-lg bg-base-200 relative hover:outline outline-primary">
                    <div class="avatar w-20 h-20">
                        <img v-if="character.image" :src="character.image" class="rounded-lg" />
                        <img v-else src="../assets/img/placeholder-avatar.webp" class="rounded-lg" />
                    </div>
                    <div class="text-lg ml-2">{{ character.name }}</div>
                    <label class="absolute w-full h-full cursor-pointer">
                        <input
                            type="checkbox"
                            :value="character.id"
                            :checked="selectedCharacters.includes(character.id)"
                            @change="setSelected"
                            class="checkbox absolute top-2 right-4" />
                    </label>
                </div>
            </template>
            <template v-else>
                <div class="font-bold text-lg pt-3 pb-5">No characters found. Create one on the characters page.</div>
            </template>
        </div>

        <h2 class="text-xl font-bold">User Character</h2>
        <div class="divider mt-0 mb-1"></div>
        <select v-model="userCharacter" class="select bg-base-200">
            <option v-for="character in userCharacters" :key="character.id" :value="character.id">
                {{ character.name }}
            </option>
        </select>
        <div class="flex flex-row mt-5">
            <button class="btn btn-primary" @click="createChat">Create Chat</button>
            <button class="btn btn-error ml-3" @click="router.push('/chats')">Cancel</button>
        </div>
    </div>
</template>
