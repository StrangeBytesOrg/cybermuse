<script lang="ts" setup>
import {reactive} from 'vue'
import {RouterLink, useRouter} from 'vue-router'
import {useToast} from 'vue-toastification'
import {client} from '../api-client'

type Entry = {name: string; content: string}
type Lore = {name: string; entries: Entry[]}
const lore = reactive<Lore>({
    name: '',
    entries: [],
})
const router = useRouter()
const toast = useToast()

const addEntry = () => {
    lore.entries.push({name: '', content: ''})
}

const createLore = async () => {
    // Remove any entries that have empty content
    lore.entries = lore.entries.filter((entry) => entry.content.trim() !== '')

    const {data, error} = await client.POST('/create-lore', {
        body: {
            lore: {
                name: lore.name,
                entries: lore.entries,
            },
        },
    })
    if (error) {
        console.error(error)
        toast.error(`Error creating lore: ${error.message}`)
        return
    }
    toast.success('Lore created')
    console.log(`New Lore Id: ${data.id}`)
    router.push('/lore')
}
</script>

<template>
    <div class="flex flex-row bg-base-300 p-3">
        <RouterLink to="/lore" class="btn btn-sm btn-neutral">
            <!-- prettier-ignore -->
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
        </RouterLink>
        <div class="text-xl ml-5">Create Lorebook</div>
    </div>

    <div class="flex flex-col bg-base-200 rounded-lg p-3 m-2">
        <input type="text" v-model="lore.name" class="input input-bordered" placeholder="Lore Name" />
        <div class="flex flex-col">
            <div v-for="(entry, index) in lore.entries" :key="index" class="flex flex-col">
                <div class="divider"></div>
                <input type="text" v-model="entry.name" class="input input-bordered mt-2" placeholder="Entry Name" />
                <textarea
                    v-model="entry.content"
                    class="textarea textarea-bordered mt-2"
                    placeholder="Entry Content"></textarea>
            </div>
        </div>
        <div class="flex flex-row mt-3">
            <button @click="addEntry" class="btn btn-sm btn-primary">Add Entry</button>
            <button @click="createLore" class="btn btn-sm btn-primary ml-3">Save</button>
        </div>
    </div>
</template>
