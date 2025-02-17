<script lang="ts" setup>
import {reactive, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {db, characterCollection} from '@/db'
import FileSelect from '@/components/file-select.vue'

const route = useRoute()
const router = useRouter()
const characterId = route.params.id
const characterImage = ref<string>()

if (!characterId || Array.isArray(characterId)) {
    router.push({name: 'characters'})
    throw new Error('Character not found')
}

const character = reactive(await characterCollection.findById(characterId))
if (!character) {
    router.push({name: 'characters'})
    throw new Error('Character not found')
}
if (character._attachments) {
    const avatar = (await db.getAttachment(characterId, 'avatar')) as Blob
    characterImage.value = URL.createObjectURL(avatar)
}

const updateCharacter = async () => {
    await characterCollection.put(character)
    router.push({name: 'characters'})
}

const deleteCharacter = async () => {
    await characterCollection.removeById(characterId)
    router.push({name: 'characters'})
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
    characterImage.value = undefined
    delete character._attachments
}
</script>

<template>
    <main v-if="character" class="flex flex-col w-full bg-base-200 rounded-lg p-3">
        <input
            type="text"
            v-model="character.name"
            class="input input-bordered w-full sm:max-w-80 mb-auto mr-5 border-2 focus:outline-none focus:border-primary"
            placeholder="Character Name" />

        <textarea
            v-model="character.description"
            placeholder="Description"
            class="textarea textarea-bordered w-full mt-5 min-h-36 border-2 leading-normal focus:outline-none focus:border-primary" />

        <textarea
            v-model="character.firstMessage"
            placeholder="First Message"
            class="textarea textarea-bordered w-full mt-5 min-h-36 border-2 leading-normal focus:outline-none focus:border-primary" />

        <select v-model="character.type" class="select select-bordered w-full sm:max-w-80 mt-5">
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
            <FileSelect @changed="uploadAvatar" class="ml-5 mt-auto" />
            <button v-if="characterImage" class="btn btn-error mt-auto ml-5" @click="removeImage">Remove</button>
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
                <button class="btn btn-error" @click="deleteCharacter()">Delete</button>
            </div>
        </div>
    </dialog>
</template>
