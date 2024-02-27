<script lang="ts" setup>
import {useCharacterStore} from '../store'

const route = useRoute()
const characterStore = useCharacterStore()
const characterId = route.query.id
const character = characterStore.characters[characterId]
</script>

<template>
    <div>
        <h1>Character</h1>
        Name: {{ character.name }}
        <br />
        Description: {{ character.description }}
    </div>
</template>
