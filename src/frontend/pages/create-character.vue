<script lang="ts" setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {db} from '../db'

const router = useRouter()
const character = ref({
    name: '',
    description: '',
    image: '',
})

const createCharacter = async () => {
    await db.characters.add({
        name: character.value.name,
        description: character.value.description,
        image: character.value.image,
    })
    await router.push('/characters')
}

const uploadImage = () => {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement
    if (fileInput) {
        fileInput.click()
    }
}

const handleFileUpload = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (!(target instanceof HTMLInputElement) || !target.files) {
        console.error('oh no')
        return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
        if (e.target === null || e.target.result === null) {
            console.error('FileReader failed to read file')
            return
        }
        character.value.image = e.target.result as string
    }
    reader.readAsDataURL(target.files[0])
}

const removeImage = () => {
    character.value.image = ''
}

const cancelCharacter = () => {
    router.push('/characters')
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

        <!-- Avatar -->
        <div class="flex flex-row mt-5">
            <div class="avatar">
                <div class="w-36 h-36 rounded-xl">
                    <img v-if="character.image" :src="character.image" :alt="character.name + ' avatar'" />
                    <img v-else src="../assets/img/placeholder-avatar.webp" :alt="character.name + ' avatar'" />
                </div>
            </div>
            <button class="btn btn-primary mt-auto ml-5" @click="uploadImage">Upload</button>
            <button v-if="character.image" class="btn btn-error mt-auto ml-5" @click="removeImage">Delete</button>
            <input type="file" id="fileInput" @change="handleFileUpload" class="hidden" />
        </div>

        <div class="divider"></div>
        <div class="flex flex-row">
            <button class="btn btn-primary" @click="createCharacter">Create</button>
            <button class="btn btn-error ml-5" @click="cancelCharacter">Cancel</button>
        </div>
    </div>
</template>
