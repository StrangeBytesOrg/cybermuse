<script lang="ts" setup>
import {reactive} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useToastStore} from '@/store'
import {loreCollection} from '@/db'
import {TrashIcon} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const loreId = route.params.id

if (!loreId || Array.isArray(loreId)) {
    router.push({name: 'lore'})
    throw new Error('No lore ID provided')
}

const lore = reactive(await loreCollection.findById(loreId))

const addEntry = () => {
    lore.entries.push({name: '', content: ''})
}

const removeEntry = (index: number) => {
    lore.entries.splice(index, 1)
}

const updateLore = async () => {
    // Remove any entries that have empty content
    lore.entries = lore.entries.filter((entry) => entry.content.trim() !== '')

    await loreCollection.update(lore)
    toast.success('Lore updated')
}

const deleteLore = async () => {
    await loreCollection.removeById(loreId)
    toast.success('Lore deleted')
    router.push({name: 'lore'})
}
</script>

<template>
    <main class="flex flex-col bg-base-200 rounded-lg p-3">
        <input type="text" v-model="lore.name" class="input" placeholder="Lore Name" />

        <div class="flex flex-col">
            <div v-for="(entry, index) in lore.entries" :key="index" class="w-full">
                <div class="divider"></div>
                <div class="flex flex-col w-full">
                    <div class="flex flex-row w-full">
                        <div class="flex flex-col w-full">
                            <input
                                type="text"
                                v-model="entry.name"
                                class="input mt-2 max-w-96"
                                placeholder="Entry Name"
                            />
                            <textarea
                                v-model="entry.content"
                                class="textarea w-full min-h-32 mt-2"
                                placeholder="Entry Content"></textarea>
                        </div>
                        <button @click="removeEntry(index)" class="btn btn-sm btn-error mt-auto ml-3">
                            <TrashIcon class="size-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex flex-row mt-3">
            <button @click="addEntry" class="btn btn-sm btn-primary">+ Add Entry</button>
            <button @click="updateLore" class="btn btn-sm btn-primary ml-3">Save</button>
            <button onclick="delete_confirm.showModal()" class="btn btn-sm btn-error ml-3">Delete</button>
        </div>
    </main>

    <dialog id="delete_confirm" class="modal">
        <div class="modal-box">
            <h3 class="text-lg font-bold">Are you sure you want to delete this Lorebook?</h3>
            <p class="pt-4">This will also remove if from all existing chats</p>
            <div class="modal-action">
                <form method="dialog">
                    <button class="btn">Cancel</button>
                </form>
                <button class="btn btn-error" @click="deleteLore">Delete</button>
            </div>
        </div>
    </dialog>
</template>
