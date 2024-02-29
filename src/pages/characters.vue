<script lang="ts" setup>
import {useCharacterStore} from '../store'

const characterStore = useCharacterStore()
</script>

<template>
    <div class="flex flex-col p-5">
        <template v-if="characterStore.characters.length">
            <div v-for="(character, characterIndex) in characterStore.characters" :key="character.name">
                <router-link :to="`/character?id=${characterIndex}`" class="card bg-base-200 mb-5">
                    <div class="card-body flex flex-row">
                        <div class="avatar">
                            <div class="w-24 rounded-xl">
                                <img src="/placeholder-avatar.webp" alt="{{character.name}} avatar" />
                            </div>
                        </div>
                        <div class="inline-flex flex-col">
                            <div class="font-bold">
                                {{ character.name }}
                            </div>
                            <div class="text-gray-500">
                                {{ character.description }}
                            </div>
                        </div>
                    </div>
                </router-link>
                <!-- <router-link :to="`/chat?id=${characterIndex}`" class="btn btn-primary">Chat</router-link> -->
            </div>
        </template>
        <template v-else>
            <div>no characters</div>
        </template>
    </div>
</template>
