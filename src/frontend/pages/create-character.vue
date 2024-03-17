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
    <div class="flex flex-col p-5">
        <!-- Character Details -->
        <div class="card bg-base-200 p-5">
            <h2 class="text-xl">Character Info</h2>
            <div class="divider mt-2"></div>

            <input
                type="text"
                v-model="character.name"
                class="input input-bordered mb-auto mr-5 max-w-80 border-2 focus:outline-none focus:border-primary"
                placeholder="Character Name" />

            <textarea
                class="textarea textarea-bordered mt-5 min-h-36 border-2 leading-normal focus:outline-none focus:border-primary"
                v-model="character.description"
                placeholder="Description"></textarea>

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
    </div>
</template>
