<script lang="ts" setup>
import {ref} from 'vue'
import {db} from '../db'

const characterName = ref('')
const characterDescription = ref('')

const createCharacter = async () => {
    await db.characters.add({
        name: characterName.value,
        description: characterDescription.value,
    })
    await navigateTo('/characters')
}
</script>

<template>
    <div class="flex flex-col p-5">
        <input type="text" class="input input-bordered" v-model="characterName" placeholder="Character Name" />
        <textarea
            class="textarea textarea-bordered mt-5"
            v-model="characterDescription"
            placeholder="Description"></textarea>
        <button @click="createCharacter" class="btn btn-primary mt-5">Create</button>
    </div>
</template>
