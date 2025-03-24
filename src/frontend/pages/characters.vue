<script lang="ts" setup>
import {ref, reactive, computed} from 'vue'
import {RouterLink} from 'vue-router'
import {characterCollection} from '@/db'

const searchName = ref('')
const orderBy = ref('newest-update')
const characterType = ref<'user' | 'character' | 'both'>('both')
const characters = reactive(await characterCollection.toArray())

const updateSortOrder = () => {
    characters.sort((a, b) => {
        if (orderBy.value === 'newest-update') return b.lastUpdate - a.lastUpdate
        if (orderBy.value === 'oldest-update') return a.lastUpdate - b.lastUpdate
        if (orderBy.value === 'name') return a.name.localeCompare(b.name)
        return 0
    })
}

// Computed property to filter characters based on search input and character type
const filteredCharacters = computed(() => {
    return characters.filter((character) => {
        const matchesName = character.name.toLowerCase().includes(searchName.value.toLowerCase())
        const matchesType = character.type === characterType.value || characterType.value === 'both'
        return matchesName && matchesType
    })
})
</script>

<template>
    <Teleport to="#topbar">
        <RouterLink to="/create-character" class="btn btn-sm btn-primary absolute top-2 left-2">
            Create Character +
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

        <select @change="updateSortOrder" v-model="orderBy" class="select w-full sm:w-1/3">
            <option value="newest-update">Recently Updated</option>
            <option value="oldest-update">Oldest Updated</option>
            <option value="name">Name</option>
        </select>
    </div>

    <div class="flex flex-col m-2">
        <template v-if="filteredCharacters.length">
            <div v-for="character in filteredCharacters" :key="character.name">
                <router-link
                    :to="{name: 'character', params: {id: character.id}}"
                    class="flex bg-base-200 rounded-lg p-2 mb-3 hover:outline outline-primary">
                    <div class="avatar">
                        <div class="w-36 max-h-36 rounded-xl">
                            <img v-if="character.avatar" :src="character.avatar" :alt="character.name" />
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
