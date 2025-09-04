import {deleteDB} from 'idb'
import {db, collections} from '@/db'
import client from '@/clients/sync-client'
import {useSettingsStore} from '@/store'

export const sync = async () => {
    const settings = useSettingsStore()
    if (!settings.syncServer) throw new Error('No sync server selected')

    const {data: remoteDocs, error} = await client.GET('/list', {
        baseUrl: settings.syncServer,
        credentials: 'same-origin',
    })
    if (error) throw error

    // Sync Down
    for (const {key, collection, lastUpdate} of remoteDocs) {
        const localDoc = await db.get(collection, key)
        // TODO pull if localDoc version < remote version (but not past current schema version)
        if (!localDoc || lastUpdate > localDoc.lastUpdate) {
            console.log(`Pulling: ${collection}/${key}`)
            const {data, error} = await client.GET('/download/{collection}/{key}', {
                baseUrl: settings.syncServer,
                params: {
                    path: {collection, key},
                },
            })
            if (error) throw error

            const localCollection = collections[collection]
            if (!data) throw new Error(`No data received for ${collection}/${key}`)
            if (!localCollection) throw new Error(`No collection found for ${collection}`)
            if (data.deleted) {
                // If the document is marked as deleted, skip migration and schema validation
                await db.put(collection, data)
                continue
            }
            if (data.version < localCollection.version) {
                const migrated = await localCollection.migrate(data)
                await localCollection.put(migrated, false)
            } else {
                await localCollection.put(data, false)
            }
        }
    }

    // Sync up
    const docsToPush = []
    for (const collection of db.objectStoreNames) {
        const localDocs = await db.getAll(collection)
        for (const doc of localDocs) {
            const remoteDoc = remoteDocs.find(d => d.collection === collection && d.key === doc.id)
            // TODO also push if localDoc version > remote version
            if (!remoteDoc || doc.lastUpdate > remoteDoc.lastUpdate) {
                console.log(`Pushing: ${collection}/${doc.id}`)
                docsToPush.push({
                    key: doc.id,
                    collection,
                    doc,
                })
            }
        }
    }
    if (docsToPush.length) {
        const {error: pushError} = await client.PUT('/upload', {
            baseUrl: settings.syncServer,
            body: docsToPush,
        })
        if (pushError) throw error
    }
}

export const exportData = async () => {
    const data: Record<string, unknown> = {}
    for (const stores of db.objectStoreNames) {
        data[stores] = await db.getAll(stores)
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
        await deleteDB('cybermuse')
        localStorage.clear()
        window.location.reload()
    }
}
