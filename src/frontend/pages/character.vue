<script lang="ts" setup>
import {reactive, toRaw} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {db} from '@/db'
import FileSelect from '@/components/file-select.vue'

const route = useRoute()
const router = useRouter()
const characterId = route.params.id

if (!characterId || Array.isArray(characterId)) {
    router.push({name: 'characters'})
    throw new Error('Character not found')
}

const character = reactive(await db.characters.get(characterId))
if (!character) {
    router.push({name: 'characters'})
    throw new Error('Character not found')
}

const updateCharacter = async () => {
    await db.characters.put(toRaw(character))
    router.push({name: 'characters'})
}

const deleteCharacter = async () => {
    await db.characters.delete(characterId)
    router.push({name: 'characters'})
}

const uploadAvatar = async (file: File) => {
    const fileReader = new FileReader()
    fileReader.onload = () => {
        character.avatar = fileReader.result as string
    }
    fileReader.readAsDataURL(file)
}

const removeImage = () => {
    delete character.avatar
}
</script>

<template>
    <main v-if="character" class="flex flex-col w-full bg-base-200 rounded-lg p-3">
        <input
            type="text"
            v-model="character.name"
            class="input w-full sm:max-w-80 mb-auto mr-5 border-2"
            placeholder="Character Name"
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
            <FileSelect @changed="uploadAvatar" class="ml-5 mt-auto" />
            <button v-if="character.avatar" class="btn btn-error mt-auto ml-5" @click="removeImage">Remove</button>
        </div>

        <div class="divider"></div>
        <div class="flex flex-row">
            <button class="btn btn-primary" @click="updateCharacter()">Update</button>
            <button class="btn btn-error ml-5" onclick="delete_confirm.showModal()">Delete</button>
        </div>
    </main>

    <dialog id="delete_confirm" class="modal">
        <div class="modal-box">
            <h3 class="text-lg font-bold">Are you sure you want to delete this character?</h3>
            <p class="pt-4">This will also remove all character messages from existing chats</p>
            <div class="modal-action">
                <form method="dialog">
                    <button class="btn">Cancel</button>
                </form>
                <button class="btn btn-error" @click="deleteCharacter">Delete</button>
            </div>
        </div>
    </dialog>
</template>
