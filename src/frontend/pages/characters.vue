<script lang="ts" setup>
import {ref, computed} from 'vue'
import {RouterLink} from 'vue-router'
import {characterCollection} from '@/db'
import Thumbnail from '@/components/thumbnail.vue'

const searchName = ref('')
const orderBy = ref('newest-update')
const characterType = ref<'user' | 'character' | 'both'>('both')
const characters = await characterCollection.toArray()

const filteredCharacters = computed(() => {
    const filtered = characters.filter((character) => {
        const matchesName = character.name.toLowerCase().includes(searchName.value.toLowerCase())
        const matchesType = character.type === characterType.value || characterType.value === 'both'
        return matchesName && matchesType
    })

    // Sort the filtered results
    return [...filtered].sort((a, b) => {
        if (orderBy.value === 'newest-update') return b.lastUpdate - a.lastUpdate
        if (orderBy.value === 'oldest-update') return a.lastUpdate - b.lastUpdate
        if (orderBy.value === 'name') return a.name.localeCompare(b.name)
        return 0
    })
})
</script>

<template>
    <Teleport to="#topbar">
        <RouterLink :to="{name: 'create-character'}" class="btn btn-sm btn-primary absolute top-2 left-2">
            Create Character
        </RouterLink>
    </Teleport>

    <!-- Sort and filter -->
    <div class="px-2 flex flex-col space-y-2 sm:flex-row sm:space-x-5">
        <input
            type="text"
            v-model="searchName"
            placeholder="Search by name"
            class="input w-full sm:w-1/3"
        />

        <select
            v-model="characterType"
            class="select w-full sm:w-1/3">
            <option value="both" default>Character Type</option>
            <option value="character">Character</option>
            <option value="user">User</option>
        </select>

        <select v-model="orderBy" class="select w-full sm:w-1/3">
            <option value="newest-update">Recently Updated</option>
            <option value="oldest-update">Oldest Updated</option>
            <option value="name">Name</option>
        </select>
    </div>

    <div class="flex flex-col m-2">
        <template v-if="filteredCharacters.length">
            <router-link
                v-for="character in filteredCharacters"
                :key="character.name"
                :to="{name: 'character', params: {id: character.id}}"
                class="flex bg-base-200 rounded-lg p-2 mb-3 hover:outline outline-primary">
                <div class="avatar">
                    <div class="w-36 max-h-36 rounded-xl">
                        <Thumbnail
                            v-if="character.avatar"
                            :image="character.avatar"
                            :width="512"
                            :height="512"
                            :alt="character.name"
                        />
                        <img v-else src="../assets/img/placeholder-avatar.webp" alt="placeholder avatar" />
                    </div>
                </div>
                <div class="inline-flex flex-col h-36 ml-3">
                    <div class="font-bold">
                        {{ character.name }}
                    </div>
                    <div class="text-gray-500 overflow-hidden h-full fadeout">
                        <p class="whitespace-pre-line">
                            {{ character.shortDescription || character.description }}
                        </p>
                    </div>
                </div>
            </router-link>
        </template>
        <div v-else>
            no characters
        </div>
    </div>
</template>

<style lang="css">
.fadeout {
    -webkit-mask-image: linear-gradient(to bottom, black 75%, transparent 100%);
    mask-image: linear-gradient(to bottom, black 75%, transparent 100%);
}
</style>
