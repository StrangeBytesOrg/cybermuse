<script lang="ts" setup>
import {ref} from 'vue'
import {useCharacterStore} from '../store'

const characterStore = useCharacterStore()
const characterName = ref('')
const characterDescription = ref('')

const createCharacter = () => {
    characterStore.characters.push({
        name: characterName.value,
        description: characterDescription.value,
    })
    characterStore.update()
}
</script>

<template>
    <input type="text" class="input input-bordered" v-model="characterName" placeholder="Character Name" />
    <textarea class="textarea textarea-bordered" v-model="characterDescription" placeholder="Description"></textarea>
    <button @click="createCharacter" class="btn btn-primary">Create</button>
</template>
