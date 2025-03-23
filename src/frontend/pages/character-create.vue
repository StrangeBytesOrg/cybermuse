<script lang="ts" setup>
import {reactive} from 'vue'
import {useRouter} from 'vue-router'
import {useToastStore} from '@/store'
import {characterCollection} from '@/db'
import FileInput from '@/components/file-select.vue'
import {decodeChunks} from '@/lib/decode-png-chunks'

const toast = useToastStore()
const router = useRouter()
// TODO this should probably use an existing type from the DB
const character = reactive({
    name: '',
    description: '',
    firstMessage: '',
    type: 'character' as 'character' | 'user',
    avatar: '' as string | undefined,
})

const createCharacter = async () => {
    await characterCollection.put({
        id: character.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        lastUpdate: Date.now(),
        ...character,
    })
    toast.success('Character created')
    await router.push({name: 'characters'})
}

const uploadAvatar = async (file: File) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
        character.avatar = reader.result as string
    })
    reader.readAsDataURL(file)
}

const removeImage = () => {
    delete character.avatar
}

const importCharacterPng = (file: File) => {
    if (file.type !== 'image/png') {
        throw new Error('Can only import characters from PNG files')
    }

    const reader = new FileReader()
    reader.addEventListener('load', () => {
        const image = reader.result as string
        const dataurl = image.split(',')[1]
        if (!dataurl) return
        const binary = atob(dataurl)
        const arrayBuffer = new ArrayBuffer(binary.length)
        const uint8Array = new Uint8Array(arrayBuffer)
        for (let i = 0; i < binary.length; i++) {
            uint8Array[i] = binary.charCodeAt(i)
        }
        const metaChunks = decodeChunks(arrayBuffer)
        const cardMeta = metaChunks.find((chunk) => chunk.keyword === 'chara')
        if (!cardMeta) {
            toast.error('No character data found in PNG')
            return
        }
        const card = JSON.parse(atob(cardMeta.value))
        character.name = card.data.name
        character.description = card.data.description
        character.firstMessage = card.data.first_mes
        uploadAvatar(file)
        toast.success('Character imported')
    })
    reader.readAsDataURL(file)
}
</script>

<template>
    <div class="flex flex-col p-3 bg-base-200 rounded-lg">
        <input
            type="text"
            v-model="character.name"
            placeholder="Character Name"
            class="input w-full sm:max-w-80 mb-auto mr-5 border-2"
        />

        <textarea
            v-model="character.description"
            placeholder="Description"
            class="textarea w-full mt-5 min-h-36 border-2 leading-normal"
        />

        <textarea
            v-model="character.firstMessage"
            placeholder="First Message"
            class="textarea w-full mt-5 min-h-36 border-2 leading-normal"
        />

        <select v-model="character.type" class="select w-full sm:max-w-80 mt-5">
            <option value="character">Character</option>
            <option value="user">User</option>
        </select>

        <!-- Avatar -->
        <div class="flex flex-row mt-5">
            <div class="avatar">
                <div class="w-36 h-36 rounded-xl">
                    <img v-if="character.avatar" :src="character.avatar" :alt="character.name + ' avatar'" />
                    <img v-else src="../assets/img/placeholder-avatar.webp" :alt="character.name + ' avatar'" />
                </div>
            </div>

            <FileInput @changed="uploadAvatar" class="ml-5 mt-auto" />
            <button v-if="character.avatar" class="btn btn-error mt-auto ml-5" @click="removeImage">Remove</button>
        </div>

        <div class="divider"></div>
        <div class="flex flex-row">
            <button class="btn btn-primary" @click="createCharacter">Create</button>
            <FileInput @changed="importCharacterPng" button-label="Import Character" class="ml-2" />
            <button class="btn btn-error ml-2" @click="router.back">Cancel</button>
        </div>
    </div>
</template>
