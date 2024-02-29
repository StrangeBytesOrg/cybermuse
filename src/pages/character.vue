<script lang="ts" setup>
import {useCharacterStore} from '../store'

const route = useRoute()
const characterStore = useCharacterStore()
const characterId = route.query.id
const character = characterStore.characters[characterId]

const deleteCharacter = () => {
    characterStore.characters.splice(characterId, 1)
    characterStore.update()
}
</script>

<template>
    <div>
        <h1>Character</h1>
        Name: {{ character.name }}
        <br />
        Description: {{ character.description }}
        <br />
        <button class="btn btn-error" @click="deleteCharacter()">Delete</button>
    </div>
</template>
