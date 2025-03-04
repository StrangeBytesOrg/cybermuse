<script lang="ts" setup>
import {reactive} from 'vue'
import {useRouter} from 'vue-router'
import {useToastStore} from '@/store'
import {loreCollection} from '@/db'
import Editable from '@/components/editable.vue'

type Entry = {name: string; content: string}
type Lore = {name: string; entries: Entry[]}
const lore = reactive<Lore>({
    name: '',
    entries: [],
})
const router = useRouter()
const toast = useToastStore()

const addEntry = () => {
    lore.entries.push({name: '', content: ''})
}

const createLore = async () => {
    // Remove any entries that have empty content
    lore.entries = lore.entries.filter((entry) => entry.content.trim() !== '')

    await loreCollection.put({
        name: lore.name,
        entries: lore.entries,
    })
    toast.success('Lore created')
    router.push({name: 'lore'})
}
</script>

<template>
    <div class="flex flex-col bg-base-200 rounded-lg p-3 m-2">
        <input type="text" v-model="lore.name" class="input" placeholder="Lore Name" />
        <div class="flex flex-col">
            <div v-for="(entry, index) in lore.entries" :key="index" class="flex flex-col">
                <div class="divider"></div>
                <input type="text" v-model="entry.name" class="input" placeholder="Entry Name" />
                <Editable
                    v-model="entry.content"
                    class="textarea w-full max-h-96 overflow-y-scroll whitespace-pre-wrap mt-2 p-2 focus:outline-none"
                />
            </div>
        </div>
        <div class="flex flex-row mt-3">
            <button @click="addEntry" class="btn btn-sm btn-primary">Add Entry</button>
            <button @click="createLore" class="btn btn-sm btn-primary ml-3">Save</button>
        </div>
    </div>
</template>
