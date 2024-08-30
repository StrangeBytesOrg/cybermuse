<script lang="ts" setup>
import {reactive} from 'vue'
import {RouterLink} from 'vue-router'
import {useToast} from 'vue-toastification'
import {client} from '../api-client'

const toast = useToast()
const {data, error} = await client.GET('/lore')
if (error) {
    toast.error(`Error fetching lore: ${error.message}`)
}
const loreBooks = reactive(data || [])
</script>

<template>
    <div class="flex flex-row p-3 bg-base-300">
        <h1 class="text-xl">Lore Books</h1>
        <RouterLink to="/create-lore" class="btn btn-sm btn-primary ml-auto">New Lorebook +</RouterLink>
    </div>

    <div class="flex flex-row m-2">
        <div class="bg-base-200 rounded-lg w-full max-w-96 p-3">
            <template v-if="loreBooks.length">
                <RouterLink
                    v-for="book in loreBooks"
                    :key="book.id"
                    :to="`/lore/${book.id}`"
                    class="block bg-base-100 min-h-32 rounded-lg p-2 mb-3 hover:outline outline-primary">
                    {{ book.name }}
                    <div>Entries: {{ book.entries.length }}</div>
                </RouterLink>
            </template>
            <div v-else>No lorebooks</div>
        </div>
    </div>
</template>
