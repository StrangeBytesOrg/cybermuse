<script lang="ts" setup>
import {RouterLink} from 'vue-router'
import {loreCollection} from '@/db'

const loreBooks = await loreCollection.toArray()
</script>

<template>
    <Teleport to="#topbar">
        <RouterLink :to="{name: 'create-lore'}" class="btn btn-sm btn-primary absolute top-2 left-2">New Lorebook +</RouterLink>
    </Teleport>

    <div class="flex flex-row">
        <div class="bg-base-200 rounded-lg w-full max-w-96 p-3">
            <template v-if="loreBooks.length">
                <RouterLink
                    v-for="book in loreBooks"
                    :key="book.id"
                    :to="{name: 'edit-lore', params: {id: book.id}}"
                    class="block bg-base-100 min-h-32 rounded-lg p-2 mb-3 hover:outline outline-primary">
                    {{ book.name }} <div>Entries: {{ book.entries.length }}</div>
                </RouterLink>
            </template>
            <div v-else>No lorebooks</div>
        </div>
    </div>
</template>
