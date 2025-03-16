<script lang="ts" setup>
import {db} from '@/db'
import {useToastStore, useSettingsStore} from '@/store'
import client from '@/sync-client'

const toast = useToastStore()
const settings = useSettingsStore()

const setProvider = (event: Event) => {
    const target = event.target as HTMLSelectElement
    settings.setSyncProvider(target.value)
}

const sync = async () => {
    const {data: remoteDocs, error} = await client.GET('/list', {
        params: {header: {token: localStorage.getItem('token') || ''}},
    })
    if (error) {
        toast.error(`Syncing failed: ${error}`)
        return
    }

    // Sync Down
    for (const {key, collection, lastUpdate} of remoteDocs) {
        const localDoc = await db.tables.find(t => t.name === collection)?.get(key)
        if (!localDoc || lastUpdate > localDoc.lastUpdate) {
            console.log(`Pulling: ${collection}.${key}`)
            const {data, error} = await client.GET('/download/{collection}/{key}', {
                params: {
                    path: {collection, key},
                    header: {token: localStorage.getItem('token') || ''},
                },
            })
            if (error) {
                toast.error(`Syncing failed: ${error}`)
                return
            }
            await db.tables.find(t => t.name === collection)?.put(data)
        }
    }

    // Sync up
    for (const table of db.tables) {
        const localDocs = await table.toArray()
        for (const doc of localDocs) {
            const remoteDoc = remoteDocs.find(d => d.collection === table.name && d.key === doc.id)
            if (!remoteDoc || doc.lastUpdate > remoteDoc.lastUpdate) {
                console.log(`Pushing: ${table.name}/${doc.id}`)
                const {error} = await client.PUT('/upload/', {
                    params: {
                        header: {token: localStorage.getItem('token') || ''},
                    },
                    body: {
                        key: doc.id,
                        collection: table.name,
                        doc,
                    },
                })
                if (error) {
                    toast.error(`Syncing failed: ${error}`)
                    return
                }
            }
        }
    }

    toast.success('Synced')
}
</script>

<template>
    <label class="label">Sync Provider</label>
    <div class="flex flex-row">
        <select @change="setProvider" :value="settings.syncProvider" class="select">
            <option value="">Select a provider</option>
            <option value="hub">Cybermuse Hub</option>
            <option value="self-hosted">Self Hosted</option>
        </select>

        <button v-if="settings.syncProvider === 'hub'" @click="sync" class="btn btn-primary ml-2">Sync</button>
    </div>
</template>
