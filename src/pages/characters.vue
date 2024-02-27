<script lang="ts" setup>
import {useCharacterStore} from '../store'

const characterStore = useCharacterStore()

const deleteCharacter = (index: number) => {
    characterStore.characters.splice(index, 1)
    characterStore.update()
}
</script>

<template>
    <template v-if="characterStore.characters.length">
        <div v-for="(character, characterIndex) in characterStore.characters" :key="character.name">
            <router-link :to="`/character?id=${characterIndex}`">{{ character.name }}</router-link>
            <router-link :to="`/chat?id=${characterIndex}`" class="btn btn-primary">Chat</router-link>
            <router-link :to="`/character?id=${characterIndex}`" class="btn btn-secondary">Info</router-link>
            <button class="btn btn-error" @click="deleteCharacter(characterIndex)">Delete</button>
        </div>
    </template>
    <template v-else>
        <div>no characters</div>
    </template>
</template>
