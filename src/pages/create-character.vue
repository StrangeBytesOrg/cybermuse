<script lang="ts" setup>
import {ref} from 'vue'
const charName = ref('')

const createCharacter = () => {
    const existingCharactersString = localStorage.getItem('characters')
    let existingCharacters = JSON.parse(existingCharactersString)
    if (existingCharacters === null) {
        existingCharacters = []
    }
    existingCharacters.push({
        name: charName.value,
    })
    localStorage.setItem('characters', JSON.stringify(existingCharacters))
}
</script>

<template>
    <input type="text" class="" v-model="charName" />
    <button @click="createCharacter" class="btn btn-primary">Create</button>
</template>
