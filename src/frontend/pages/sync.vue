<script lang="ts" setup>
import {ref} from 'vue'
import {db} from '@/db'
import {useToastStore} from '@/store'
import client from '@/sync-client'

const toast = useToastStore()
const syncProvider = ref('hub')

const syncDown = async () => {
    const {data: remoteDocs, error} = await client.GET('/list')
    if (error) {
        toast.error(`Syncing failed: ${error}`)
        return
    }
    for (const doc of remoteDocs) {
        const [store, id] = doc.key.split('/')
        const collection = db.tables.find(t => t.name === store)
        if (!collection) {
            console.error(`Collection not found: ${store}`)
            return
        }
        const localDoc = await collection.get(id)

        if (!localDoc || doc.lastUpdate > localDoc.lastUpdate) {
            console.log(`Pulling: ${doc.key}`)
            const {data, error} = await client.GET('/download/{key}', {
                params: {path: {key: doc.key}},
            })
            if (error) {
                toast.error(`Syncing failed: ${error}`)
                return
            }
            await collection.put(data)
        }
    }
    toast.success('Synced down')
}

const syncUp = async () => {
    const {data: remoteDocs, error} = await client.GET('/list')
    if (error) {
        toast.error(`Syncing failed: ${error}`)
        return
    }

    for (const table of db.tables) {
        const localDocs = await table.toArray()
        for (const doc of localDocs) {
            const remoteDoc = remoteDocs.find(d => d.key === `${table.name}/${doc.id}`)
            if (!remoteDoc || doc.lastUpdate > remoteDoc.lastUpdate) {
                console.log(`Pushing: ${table.name}/${doc.id}`)
                const {error} = await client.PUT('/upload/{key}', {
                    params: {path: {key: `${table.name}/${doc.id}`}},
                    body: doc,
                })
                if (error) {
                    toast.error(`Syncing failed: ${error}`)
                    return
                }
            }
        }
    }
    toast.success('Synced up')
}
</script>

<template>
    <main class="flex flex-col">
        <label class="label">Sync Provider</label>
        <div class="flex flex-row">
            <select v-model="syncProvider" class="select">
                <option value="">Select a provider</option>
                <option value="hub">Cybermuse Hub</option>
                <option value="self-hosted" disabled>Self Hosted</option>
            </select>
        </div>

        <div v-if="syncProvider === 'hub'" class="flex flex-row mt-3">
            <button class="btn btn-primary" @click="syncDown">Sync Down</button>
            <button class="btn btn-primary ml-2" @click="syncUp">Sync Up</button>
        </div>
    </main>
</template>
