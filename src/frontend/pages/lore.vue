<script lang="ts" setup>
import {reactive} from 'vue'
import {RouterLink} from 'vue-router'
import TopBar from '@/components/top-bar.vue'
import {loreCollection} from '@/db'

const loreBooks = reactive(await loreCollection.find())
</script>

<template>
    <TopBar title="Lore Books">
        <RouterLink to="/create-lore" class="btn btn-sm btn-primary ml-auto">New Lorebook +</RouterLink>
    </TopBar>

    <div class="flex flex-row m-2">
        <div class="bg-base-200 rounded-lg w-full max-w-96 p-3">
            <template v-if="loreBooks.length">
                <RouterLink
                    v-for="book in loreBooks"
                    :key="book._id"
                    :to="`/lore/${book._id}`"
                    class="block bg-base-100 min-h-32 rounded-lg p-2 mb-3 hover:outline outline-primary">
                    {{ book.name }}
                    <div>Entries: {{ book.entries.length }}</div>
                </RouterLink>
            </template>
            <div v-else>No lorebooks</div>
        </div>
    </div>
</template>
