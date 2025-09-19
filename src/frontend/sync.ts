import {deleteDB} from 'idb'
import {db, collections} from '@/db'
import {createSyncClient} from '@/clients/sync-client'
import {useSettingsStore, useSyncStore} from '@/store'

export const sync = async () => {
    const settings = useSettingsStore()
    const syncStore = useSyncStore()
    const client = createSyncClient(settings.syncServer)

    if (!settings.syncServer) throw new Error('No sync server selected')

    try {
        syncStore.startSync()

        const {data: listData, error: listError} = await client.GET('/list')
        if (listError) throw listError

        const documentsToDownload = []
        const documentsToUpload = []

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

        // Build documents to upload array
        for (const collection of Object.keys(collections)) {
            const localDocs = await db.getAll(collection)
            for (const doc of localDocs) {
                const remoteDoc = listData.documents.find(d => d.key === `${collection}:${doc.id}`)
                if (!remoteDoc || doc.lastUpdate > remoteDoc.lastUpdate) {
                    documentsToUpload.push({key: `${collection}:${doc.id}`, doc})
                }
            }
        }

        const totalOperations = documentsToDownload.length + documentsToUpload.length
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

            const {data, error} = await client.GET('/download/{key}', {params: {path: {key}}})
            if (error) throw error

            const localCollection = collections[collection]
            if (!data) throw new Error(`No data received for ${collection}/${id}`)
            if (!localCollection) throw new Error(`No collection found for ${collection}`)
            if (data.version < localCollection.version) {
                const migrated = await localCollection.migrate(data)
                await db.put(collection, migrated)
            } else {
                localCollection.validate(data)
                await db.put(collection, data)
            }

            currentOperation += 1
        }

        // Process deletions (no progress update since its basically instant)
        for (const {key, deletedAt} of listData.deletions) {
            const [collection, id] = key.split(':')
            if (!collection || !id) throw new Error(`Invalid deletion key: ${key}`)
            const isDeleted = await db.get('deletions', id)
            if (isDeleted) continue
            await db.delete(collection, id)
            await db.put('deletions', {id, collection, deletedAt})
        }

        // Sync up documents
        syncStore.updateProgress({
            phase: 'uploading',
            current: currentOperation,
            message: `Uploading ${documentsToUpload.length} documents...`,
        })
        for (const {key, doc} of documentsToUpload) {
            syncStore.updateProgress({
                current: currentOperation,
                message: `Uploading ${key}...`,
            })
            const {error: uploadError} = await client.PUT('/upload', {
                body: {key, doc},
            })
            if (uploadError) throw uploadError
            currentOperation += 1
        }

        // Sync up deletions
        syncStore.updateProgress({
            phase: 'processing-deletions',
            current: currentOperation,
            message: `Processing ${listData.deletions.length} deletions...`,
        })
        const deletions = await db.getAll('deletions')
        for (const deletion of deletions) {
            const existsRemotely = listData.deletions.find(d => d.key === `${deletion.collection}:${deletion.id}`)
            if (!existsRemotely) {
                syncStore.updateProgress({
                    current: currentOperation,
                    message: `Uploading deletion for ${deletion.id}...`,
                })
                const {error: deletionError} = await client.DELETE('/', {
                    body: {
                        key: `${deletion.collection}:${deletion.id}`,
                        deletedAt: deletion.deletedAt,
                    },
                })
                if (deletionError) throw deletionError
            }
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
    }
}
