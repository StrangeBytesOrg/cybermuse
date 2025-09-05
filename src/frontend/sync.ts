import {deleteDB} from 'idb'
import {db, collections} from '@/db'
import client from '@/clients/sync-client'
import {useSettingsStore} from '@/store'

export const sync = async () => {
    const settings = useSettingsStore()
    if (!settings.syncServer) throw new Error('No sync server selected')

    const {data: listData, error: listError} = await client.GET('/list', {
        baseUrl: settings.syncServer,
        credentials: 'same-origin',
    })
    if (listError) throw listError

    // TODO Use a transaction for the whole sync process
    // Sync down documents
    for (const {key, lastUpdate} of listData.documents) {
        const [collection, id] = key.split(':')
        if (!collection || !id) throw new Error(`Invalid document key: ${key}`)
        const isDeleted = await db.get('deletions', id)
        if (isDeleted) continue
        const localDoc = await db.get(collection, id)
        if (!localDoc || lastUpdate > localDoc.lastUpdate) {
            console.log(`Pulling: ${key}`)
            const {data, error} = await client.GET('/download/{key}', {
                baseUrl: settings.syncServer,
                params: {path: {key}},
            })
            if (error) throw error

            const localCollection = collections[collection]
            if (!data) throw new Error(`No data received for ${collection}/${id}`)
            if (!localCollection) throw new Error(`No collection found for ${collection}`)
            if (data.version < localCollection.version) {
                const migrated = await localCollection.migrate(data)
                await localCollection.put(migrated, false)
            } else {
                await localCollection.put(data, false)
            }
        }
    }

    // Sync down deletions
    for (const {key, deletedAt} of listData.deletions) {
        const [collection, id] = key.split(':')
        if (!collection || !id) throw new Error(`Invalid deletion key: ${key}`)
        const isDeleted = await db.get('deletions', id)
        if (isDeleted) continue
        console.log(`Processing deletion: ${collection}:${id}`)
        await db.delete(collection, id)
        await db.put('deletions', {id, collection, deletedAt})
    }

    // Sync up documents
    const docsToPush = []
    for (const collection of Object.keys(collections)) {
        const localDocs = await db.getAll(collection)
        for (const doc of localDocs) {
            const remoteDoc = listData.documents.find(d => d.key === `${collection}:${doc.id}`)
            // TODO also push if localDoc version > remote version
            if (!remoteDoc || doc.lastUpdate > remoteDoc.lastUpdate) {
                console.log(`Pushing: ${collection}:${doc.id}`)
                docsToPush.push({key: `${collection}:${doc.id}`, doc})
            }
        }
    }

    const deletions = (await db.getAll('deletions')).map((deletion) => ({
        key: `${deletion.collection}:${deletion.id}`,
        deletedAt: deletion.deletedAt,
    }))

    if (docsToPush.length || deletions.length) {
        const {error: pushError} = await client.PUT('/upload', {
            baseUrl: settings.syncServer,
            body: {
                documents: docsToPush,
                deletions,
            },
        })
        if (pushError) throw pushError
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
