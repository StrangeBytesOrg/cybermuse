<script lang="ts" setup>
import {reactive} from 'vue'
import {RouterLink} from 'vue-router'
import {client} from '../api-client'
import TopBar from '../components/top-bar.vue'

const res = await client.characters.getAll.query()
const characters = reactive(res)
</script>

<template>
    <TopBar title="Characters">
        <RouterLink to="/create-character" class="btn btn-sm btn-primary ml-auto">Create Character +</RouterLink>
    </TopBar>

    <div class="flex flex-col m-2">
        <template v-if="characters.length">
            <div v-for="character in characters" :key="character.name">
                <router-link
                    :to="`/character?id=${character.id}`"
                    class="flex bg-base-200 rounded-lg p-2 mb-3 hover:outline outline-primary">
                    <div class="avatar">
                        <div class="w-36 max-h-36 rounded-xl">
                            <img v-if="character.image" :src="`/avatars/${character.image}`" :alt="character.name" />
                            <img v-else src="../assets/img/placeholder-avatar.webp" alt="placeholder avatar" />
                        </div>
                    </div>

                    <div class="inline-flex flex-col h-36 ml-3">
                        <div class="font-bold">
                            {{ character.name }}
                        </div>
                        <div class="text-gray-500 overflow-hidden h-full fadeout">
                            <p class="whitespace-pre-line">
                                {{ character.description }}
                            </p>
                        </div>
                    </div>
                </router-link>
            </div>
        </template>
        <template v-else>
            <div>no characters</div>
        </template>
    </div>
</template>

<style lang="css">
.fadeout {
    -webkit-mask-image: linear-gradient(to bottom, black 75%, transparent 100%);
    mask-image: linear-gradient(to bottom, black 75%, transparent 100%);
}
</style>
