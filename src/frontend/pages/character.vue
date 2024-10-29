<script lang="ts" setup>
import {reactive} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {client} from '../api-client'
import FileSelect from '../components/file-select.vue'
import BackButton from '../components/back-button.vue'

const route = useRoute()
const router = useRouter()
const characterId = Number(route.query.id)

// TODO this is pretty ugly, but should be tackled by a bigger refactor implementing something
// like a useQuery hook
let res
try {
    res = await client.characters.getById.query(characterId)
} catch {
    router.push('/characters')
    throw new Error('Character not found')
}
const character = reactive(res)

const updateCharacter = async () => {
    await client.characters.update.mutate(character)
    router.push('/characters')
}

const deleteCharacter = async () => {
    await client.characters.delete.mutate(characterId)
    router.push('/characters')
}

const uploadAvatar = async (image: string) => {
    character.image = await client.characters.uploadAvatar.mutate(image)
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

    <div v-if="character" class="flex flex-col bg-base-200 rounded-lg p-3 m-2">
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
            <button class="btn btn-error ml-5" onclick="delete_confirm.showModal()">Delete</button>
        </div>
    </div>

    <dialog id="delete_confirm" class="modal">
        <div class="modal-box">
            <h3 class="text-lg font-bold">Are you sure you want to delete this character?</h3>
            <p class="pt-4">This will also remove all existing chats</p>
            <div class="modal-action">
                <form method="dialog">
                    <button class="btn">Cancel</button>
                </form>
                <button class="btn btn-error" @click="deleteCharacter()">Delete</button>
            </div>
        </div>
    </dialog>
</template>
