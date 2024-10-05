<script lang="ts" setup>
import {reactive} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {client} from '../api-client'
import {useToast} from 'vue-toastification'
import FileSelect from '../components/file-select.vue'
import BackButton from '../components/back-button.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const characterId = Number(route.query.id)
const {data} = await client.GET(`/character/{id}`, {
    params: {path: {id: String(characterId)}},
})

if (!data) {
    setTimeout(() => {
        router.push('/characters')
    }, 500)
    throw new Error('Character not found')
}
const character = reactive(data.character)

const updateCharacter = async () => {
    const {error} = await client.POST('/update-character/{id}', {
        params: {path: {id: String(characterId)}},
        body: {
            name: character.name,
            type: character.type,
            description: character.description,
            firstMessage: character.firstMessage || undefined,
            image: character.image || undefined,
        },
    })
    if (error) {
        console.error(error)
        toast.error(`Error updating character:\n${error.message}`)
    } else {
        router.push('/characters')
    }
}

const deleteCharacter = async () => {
    const {error} = await client.POST('/delete-character/{id}', {
        params: {path: {id: String(characterId)}},
    })
    if (error) {
        console.error(error)
        toast.error(`Error deleting character:\n${error.message}`)
    } else {
        await router.push('/characters')
    }
}
const uploadAvatar = async (image: string) => {
    const {error, data} = await client.POST('/upload-avatar', {
        body: {image},
    })
    if (error) {
        console.error(error)
        toast.error('Error uploading avatar')
    } else {
        character.image = data.filename
    }
}

const removeImage = () => {
    character.image = ''
}
</script>

<template>
    <div class="flex flex-row bg-base-300 p-3">
        <BackButton />
        <h1 class="text-xl ml-5">Character</h1>
    </div>

    <div class="flex flex-col bg-base-200 rounded-lg p-3 m-2">
        <input
            type="text"
            v-model="character.name"
            class="input input-bordered mb-auto mr-5 max-w-80 border-2 focus:outline-none focus:border-primary"
            placeholder="Character Name" />

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
                    <img
                        v-if="character.image"
                        :src="`/avatars/${character.image}`"
                        :alt="character.name + ' avatar'" />
                    <img v-else src="../assets/img/placeholder-avatar.webp" :alt="character.name + ' avatar'" />
                </div>
            </div>
            <FileSelect @changed="uploadAvatar" class="ml-5 mt-auto" />
            <button v-if="character.image" class="btn btn-error mt-auto ml-5" @click="removeImage">Remove</button>
        </div>

        <div class="divider"></div>
        <div class="flex flex-row">
            <button class="btn btn-primary" @click="updateCharacter()">Update</button>
            <button class="btn btn-error ml-5" @click="deleteCharacter()">Delete</button>
        </div>
    </div>
</template>
