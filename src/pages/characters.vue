<script lang="ts" setup>
import {jsonFromLocalstorage} from '../ls'
type character = {name: string}
// const characterString = localStorage.getItem('characters')
// const characters: character[] = JSON.parse(characterString)
const characters = jsonFromLocalstorage('characters') as character[]
console.log(characters)
</script>

<template>
    <div v-for="character in characters" :key="character.name">
        {{ character.name }}
    </div>
</template>
