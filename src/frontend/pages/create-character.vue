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
    type: 'character',
})
const characterImage = ref('')

const createCharacter = async () => {
    const {error} = await client.POST('/create-character', {
        body: {
            name: character.value.name,
            description: character.value.description,
            firstMessage: character.value.firstMessage,
            type: character.value.type,
            image: characterImage.value,
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
    characterImage.value = ''
}

const cancelCharacter = () => {
    router.push('/characters')
}

const imageChanged = (newVal: string) => {
    if (newVal === '') return

    // If the image is a png, check if it has V2 card data embedded
    if (newVal.startsWith('data:image/png;base64')) {
        // Convert the image from a dataurl to an ArrayBuffer
        const dataurl = newVal.split(',')[1]
        if (!dataurl) return
        const binary = atob(dataurl)
        const arrayBuffer = new ArrayBuffer(binary.length)
        const uint8Array = new Uint8Array(arrayBuffer)
        for (let i = 0; i < binary.length; i++) {
            uint8Array[i] = binary.charCodeAt(i)
        }
        const metaChunks = decodeChunks(arrayBuffer)
        const cardMeta = metaChunks.find((chunk) => chunk.keyword === 'chara')
        if (!cardMeta) return
        const card = JSON.parse(atob(cardMeta.value))
        character.value.name = card.data.name
        character.value.description = card.data.description
        character.value.firstMessage = card.data.first_mes
    }

    // If the image is large, resize it
    const img = new Image()
    img.onload = function () {
        const MAX_WIDTH = 1024
        let width = img.width
        let height = img.height
        if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            canvas.width = width
            canvas.height = height
            ctx?.drawImage(img, 0, 0, width, height)
            const resizedImage = canvas.toDataURL('image/webp')
            characterImage.value = resizedImage
        }
    }
    img.src = newVal
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
                    <img v-if="characterImage" :src="characterImage" :alt="character.name + ' avatar'" />
                    <img v-else src="../assets/img/placeholder-avatar.webp" :alt="character.name + ' avatar'" />
                </div>
            </div>

            <FileInput v-model="characterImage" @changed="imageChanged" class="ml-5 mt-auto" />
            <button v-if="characterImage" class="btn btn-error mt-auto ml-5" @click="removeImage">Remove</button>
        </div>

        <div class="divider"></div>
        <div class="flex flex-row">
            <button class="btn btn-primary" @click="createCharacter">Create</button>
            <button class="btn btn-error ml-5" @click="cancelCharacter">Cancel</button>
        </div>
    </div>
</template>
