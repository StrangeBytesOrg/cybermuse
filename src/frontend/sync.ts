import {db} from '@/db'
import client from '@/clients/sync-client'
import {useSettingsStore, useHubStore} from '@/store'

export const sync = async () => {
    const settings = useSettingsStore()
    const hub = useHubStore()
    const baseUrl = settings.syncProvider === 'hub' ? import.meta.env.VITE_SYNC_URL : settings.syncServer
    const token = settings.syncProvider === 'hub' ? hub.token : settings.syncSecret

    if (!baseUrl) throw new Error('No sync server selected')
    if (!token) throw new Error('Sync token not set')

    const {data: remoteDocs, error} = await client.GET('/list', {
        baseUrl,
        params: {header: {authorization: `Bearer ${token}`}},
    })
    if (error) throw error

    // Sync Down
    for (const {key, collection, lastUpdate} of remoteDocs) {
        const localDoc = await db.tables.find(t => t.name === collection)?.get(key)
        if (!localDoc || lastUpdate > localDoc.lastUpdate) {
            console.log(`Pulling: ${collection}.${key}`)
            const {data, error} = await client.GET('/download/{collection}/{key}', {
                baseUrl,
                params: {
                    path: {collection, key},
                    header: {authorization: `Bearer ${token}`},
                },
            })
            if (error) throw error
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
                    baseUrl,
                    params: {header: {authorization: `Bearer ${token}`}},
                    body: {
                        key: doc.id,
                        collection: table.name,
                        doc,
                    },
                })
                if (error) throw error
            }
        }
    }
}
