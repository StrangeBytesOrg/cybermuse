import {deleteDB} from 'idb'
import {db, collections} from '@/db'
import client from '@/clients/sync-client'
import {useSettingsStore, useSyncStore} from '@/store'

export const sync = async () => {
    const settings = useSettingsStore()
    const syncStore = useSyncStore()

    if (!settings.syncServer) throw new Error('No sync server selected')

    try {
        syncStore.startSync()

        const {data: listData, error: listError} = await client.GET('/list', {
            baseUrl: settings.syncServer,
            credentials: 'same-origin',
        })
        if (listError) throw listError

        // Pre-calculate what needs to be done for accurate progress
        const documentsToDownload = []
        const docsToPush = []

        // Check documents that need downloading
        for (const docInfo of listData.documents) {
            const {key, lastUpdate} = docInfo
            const [collection, id] = key.split(':')
            if (!collection || !id) continue
            const isDeleted = await db.get('deletions', id)
            if (isDeleted) continue
            const localDoc = await db.get(collection, id)
            if (!localDoc || lastUpdate > localDoc.lastUpdate) {
                documentsToDownload.push(docInfo)
            }
        }

        // Build documents to push array
        for (const collection of Object.keys(collections)) {
            const localDocs = await db.getAll(collection)
            for (const doc of localDocs) {
                const remoteDoc = listData.documents.find(d => d.key === `${collection}:${doc.id}`)
                if (!remoteDoc || doc.lastUpdate > remoteDoc.lastUpdate) {
                    docsToPush.push({key: `${collection}:${doc.id}`, doc})
                }
            }
        }

        const totalOperations = documentsToDownload.length + (docsToPush.length > 0 ? 1 : 0) + 1
        let currentOperation = 0

        // Handle case where there's nothing to sync
        if (totalOperations === 0) {
            syncStore.updateProgress({
                phase: 'complete',
                total: 1,
                current: 1,
                message: 'Everything is already up to date',
            })
            syncStore.finishSync()
            return
        }

        // TODO Use a transaction for the whole sync process
        // Sync down documents
        syncStore.updateProgress({
            phase: 'downloading',
            total: totalOperations,
            current: currentOperation,
            message: `Downloading ${documentsToDownload.length} documents...`,
        })

        for (const {key} of documentsToDownload) {
            const [collection, id] = key.split(':')
            if (!collection || !id) throw new Error(`Invalid document key: ${key}`)

            syncStore.updateProgress({
                current: currentOperation,
                message: `Downloading ${key}...`,
            })

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
            currentOperation += 1
        }

        // Process deletions
        syncStore.updateProgress({
            phase: 'processing-deletions',
            current: currentOperation,
            message: `Processing ${listData.deletions.length} deletions...`,
        })

        for (const {key, deletedAt} of listData.deletions) {
            const [collection, id] = key.split(':')
            if (!collection || !id) throw new Error(`Invalid deletion key: ${key}`)
            const isDeleted = await db.get('deletions', id)
            if (isDeleted) continue

            await db.delete(collection, id)
            await db.put('deletions', {id, collection, deletedAt})
        }
        currentOperation += 1

        // Prepare deletions for upload
        const deletions = (await db.getAll('deletions')).map((deletion) => ({
            key: `${deletion.collection}:${deletion.id}`,
            deletedAt: deletion.deletedAt,
        }))

        if (docsToPush.length || deletions.length) {
            syncStore.updateProgress({
                phase: 'uploading',
                current: currentOperation,
                message: `Uploading ${docsToPush.length} documents and ${deletions.length} deletions...`,
            })

            const {error: pushError} = await client.PUT('/upload', {
                baseUrl: settings.syncServer,
                body: {
                    documents: docsToPush,
                    deletions,
                },
            })
            if (pushError) throw pushError
            currentOperation += 1
        }

        syncStore.finishSync()
    } catch (error) {
        syncStore.errorSync(error instanceof Error ? error.message : 'Unknown error occurred')
        throw error
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
