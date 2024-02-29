<script lang="ts" setup>
import {db} from '../db'

const characters = await db.characters.toArray()
</script>

<template>
    <div class="flex flex-col p-5">
        <template v-if="characters.length">
            <div v-for="character in characters" :key="character.name">
                <router-link
                    :to="`/character?id=${character.id}`"
                    class="card bg-base-200 mb-5 hover:outline outline-primary">
                    <div class="card-body flex flex-row">
                        <div class="avatar">
                            <div class="w-24 rounded-xl">
                                <img src="/placeholder-avatar.webp" alt="{{character.name}} avatar" />
                            </div>
                        </div>
                        <div class="inline-flex flex-col">
                            Id: {{ character.id }}
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
