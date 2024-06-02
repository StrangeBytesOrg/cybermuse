<script lang="ts" setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {client} from '../api-client'
import FileInput from '../components/file-select.vue'
import {useToast} from 'vue-toastification'
import {decodeChunks} from '../lib/decode-png-chunks'

const toast = useToast()
const router = useRouter()
const character = ref({
    name: '',
    description: '',
    firstMessage: '',
    image: '',
    type: 'character',
})
const importInput = ref<HTMLInputElement>()

const createCharacter = async () => {
    const {error} = await client.POST('/create-character', {
        body: {
            name: character.value.name,
            description: character.value.description,
            firstMessage: character.value.firstMessage,
            image: character.value.image,
            type: character.value.type,
        },
    })
    if (error) {
        console.error(error)
        toast.error('Error creating character')
    } else {
        await router.push('/characters')
    }
}

const removeImage = () => {
    character.value.image = ''
}

const cancelCharacter = () => {
    router.push('/characters')
}

const importCharacter = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) {
        console.log('No file selected')
        return
    }

    const reader = new FileReader()
    reader.onload = function () {
        const arrayBuffer = reader.result as ArrayBuffer
        try {
            const metaChunks = decodeChunks(arrayBuffer)
            const characterChunk = metaChunks.find((chunk) => chunk.keyword === 'chara')
            if (!characterChunk) {
                throw new Error('Character information not found')
            }
            const card = JSON.parse(atob(characterChunk.value))

            character.value.name = card.name
            character.value.description = card.description
            character.value.firstMessage = card.first_mes
        } catch (error) {
            console.error(error)
            toast.error('Error importing character\n' + error.message)
        }
    }
    reader.readAsArrayBuffer(file)

    const imageReader = new FileReader()
    imageReader.onload = function () {
        character.value.image = imageReader.result as string
    }
    imageReader.readAsDataURL(file)
}
</script>

<template>
    <div class="flex flex-col bg-base-200 rounded-lg p-3 m-2">
        <h2 class="text-xl">Character Info</h2>
        <div class="divider mt-0 mb-1"></div>

        <input
            type="text"
            v-model="character.name"
            placeholder="Character Name"
            class="input input-bordered mb-auto mr-5 max-w-80 border-2 focus:outline-none focus:border-primary" />

        <textarea
            v-model="character.description"
            placeholder="Description"
            class="textarea textarea-bordered mt-5 min-h-36 border-2 leading-normal focus:outline-none focus:border-primary" />

        <textarea
            v-model="character.firstMessage"
            placeholder="First Message"
            class="textarea textarea-bordered mt-5 min-h-36 border-2 leading-normal focus:outline-none focus:border-primary" />

        <select v-model="character.type" class="select select-bordered mt-5">
            <option value="character">Character</option>
            <option value="user">User</option>
        </select>

        <!-- Avatar -->
        <div class="flex flex-row mt-5">
            <div class="avatar">
                <div class="w-36 h-36 rounded-xl">
                    <img v-if="character.image" :src="character.image" :alt="character.name + ' avatar'" />
                    <img v-else src="../assets/img/placeholder-avatar.webp" :alt="character.name + ' avatar'" />
                </div>
            </div>

            <FileInput v-model="character.image" class="ml-5 mt-auto" />
            <button v-if="character.image" class="btn btn-error mt-auto ml-5" @click="removeImage">Remove</button>
        </div>

        <div class="divider"></div>
        <div class="flex flex-row">
            <button class="btn btn-primary" @click="createCharacter">Create</button>
            <button class="btn btn-error ml-5" @click="cancelCharacter">Cancel</button>
            <button class="btn btn-primary ml-5" @click="importInput?.click()">Import</button>
            <input type="file" @change="importCharacter" ref="importInput" class="hidden" />
        </div>
    </div>
</template>
