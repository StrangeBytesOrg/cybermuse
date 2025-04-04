import {db} from '@/db'
import client from '@/clients/sync-client'
import {useSettingsStore} from '@/store'

export const sync = async () => {
    const settings = useSettingsStore()
    const baseUrl = settings.syncProvider === 'hub' ? import.meta.env.VITE_SYNC_URL : settings.syncServer

    if (!baseUrl) throw new Error('No sync server selected')

    const {data: remoteDocs, error} = await client.GET('/list', {baseUrl})
    if (error) throw error

    // Sync Down
    for (const {key, collection, lastUpdate} of remoteDocs) {
        const localDoc = await db.table(collection).get(key)
        if (!localDoc || lastUpdate > localDoc.lastUpdate) {
            console.log(`Pulling: ${collection}/${key}`)
            const {data, error} = await client.GET('/download/{collection}/{key}', {
                baseUrl,
                params: {
                    path: {collection, key},
                },
            })
            if (error) throw error
            await db.table(collection).put(data)
        }
    }

    // Sync up
    const docsToPush = []
    for (const table of db.tables) {
        const localDocs = await table.toArray()
        for (const doc of localDocs) {
            const remoteDoc = remoteDocs.find(d => d.collection === table.name && d.key === doc.id)
            if (!remoteDoc || doc.lastUpdate > remoteDoc.lastUpdate) {
                console.log(`Pushing: ${table.name}/${doc.id}`)
                docsToPush.push({
                    key: doc.id,
                    collection: table.name,
                    doc,
                })
            }
        }
    }
    if (docsToPush.length) {
        const {error: pushError} = await client.PUT('/upload', {
            baseUrl,
            body: docsToPush,
        })
        if (pushError) throw error
    }
}

export const exportData = async () => {
    const data: Record<string, unknown> = {}
    for (const table of db.tables) {
        data[table.name] = await table.toArray()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data.json'
    a.click()
    URL.revokeObjectURL(url)
}

export const clearData = async () => {
    if (confirm('Are you sure you want to clear all data?')) {
        await db.delete()
        localStorage.clear()
        window.location.reload()
    }
}
