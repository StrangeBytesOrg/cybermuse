<script lang="ts" setup>
import {reactive} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useToast} from 'vue-toastification'
import {client} from '../api-client'
import TopBar from '@/components/top-bar.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const loreId = Number(route.params.id)

const lore = reactive(await client.lore.getById.query(loreId))

const addEntry = () => {
    lore.entries.push({name: '', content: ''})
}

const removeEntry = (index: number) => {
    lore.entries.splice(index, 1)
}

const updateLore = async () => {
    // Remove any entries that have empty content
    lore.entries = lore.entries.filter((entry) => entry.content.trim() !== '')

    await client.lore.update.mutate(lore)
    toast.success('Lore updated')
}

const deleteLore = async () => {
    await client.lore.delete.mutate(loreId)
    toast.success('Lore deleted')
    router.push('/lore')
}
</script>

<template>
    <TopBar title="Edit Lorebook" back />

    <div class="flex flex-col bg-base-200 rounded-lg p-3 m-2">
        <input type="text" v-model="lore.name" class="input input-bordered" placeholder="Lore Name" />

        <div class="flex flex-col">
            <div v-for="(entry, index) in lore.entries" :key="index" class="w-full">
                <div class="divider"></div>
                <div class="flex flex-col w-full">
                    <div class="flex flex-row w-full">
                        <div class="flex flex-col w-full">
                            <input
                                type="text"
                                v-model="entry.name"
                                class="input input-bordered mt-2 max-w-96"
                                placeholder="Entry Name" />
                            <textarea
                                v-model="entry.content"
                                class="textarea textarea-bordered mt-2"
                                placeholder="Entry Content"></textarea>
                        </div>
                        <button @click="removeEntry(index)" class="btn btn-sm btn-error mt-auto ml-3">
                            <!-- prettier-ignore -->
                            <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex flex-row mt-3">
            <button @click="addEntry" class="btn btn-sm btn-primary">+ Add Entry</button>
            <button @click="updateLore" class="btn btn-sm btn-primary ml-3">Save</button>
            <button @click="deleteLore" class="btn btn-sm btn-error ml-3">Delete</button>
        </div>
    </div>
</template>
