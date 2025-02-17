<script lang="ts" setup>
import {reactive, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useToast} from 'vue-toastification'
import {characterCollection} from '@/db'
import FileInput from '@/components/file-select.vue'
// import {decodeChunks} from '@/lib/decode-png-chunks'

const toast = useToast()
const router = useRouter()
const character = reactive({
    name: '',
    description: '',
    firstMessage: '',
    type: 'character' as 'character' | 'user',
})
const characterImage = ref<string>()

const createCharacter = async () => {
    await characterCollection.put(character)
    toast.success('Character created')
    await router.push({name: 'characters'})
}

const uploadAvatar = async (file: File) => {
    character._attachments = {
        avatar: {
            content_type: file.type,
            data: file,
        },
    }
    characterImage.value = URL.createObjectURL(file)
}

const removeImage = () => {
    delete character._attachments
    characterImage.value = undefined
}

// TODO re-implement this function
// const importCharacterPng = async (file: File) => {
//     // If the image is a png, check if it has V2 card data embedded
//     if (image.startsWith('data:image/png;base64')) {
//         // Convert the image from a dataurl to an ArrayBuffer
//         const dataurl = image.split(',')[1]
//         if (!dataurl) return
//         const binary = atob(dataurl)
//         const arrayBuffer = new ArrayBuffer(binary.length)
//         const uint8Array = new Uint8Array(arrayBuffer)
//         for (let i = 0; i < binary.length; i++) {
//             uint8Array[i] = binary.charCodeAt(i)
//         }
//         const metaChunks = decodeChunks(arrayBuffer)
//         const cardMeta = metaChunks.find((chunk) => chunk.keyword === 'chara')
//         if (!cardMeta) return
//         const card = JSON.parse(atob(cardMeta.value))
//         character.name = card.data.name
//         character.description = card.data.description
//         character.firstMessage = card.data.first_mes
//         uploadAvatar(image)
//     }
// }
</script>

<template>
    <!-- <FileInput @changed="importCharacterPng" button-label="Import Character" button-size="btn-sm" class="ml-auto" /> -->

    <div class="flex flex-col m-2 p-3 bg-base-200 rounded-lg">
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

            <FileInput @changed="uploadAvatar" class="ml-5 mt-auto" />
            <button v-if="characterImage" class="btn btn-error mt-auto ml-5" @click="removeImage">Remove</button>
        </div>

        <div class="divider"></div>
        <div class="flex flex-row">
            <button class="btn btn-primary" @click="createCharacter">Create</button>
            <button class="btn btn-error ml-2" @click="router.back">Cancel</button>
        </div>
    </div>
</template>
