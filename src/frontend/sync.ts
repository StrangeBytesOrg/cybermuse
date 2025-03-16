import {db} from '@/db'
import client from '@/sync-client'

export const sync = async () => {
    const {data: remoteDocs, error} = await client.GET('/list', {
        params: {header: {token: localStorage.getItem('token') || ''}},
    })
    if (error) throw error

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
                    params: {
                        header: {token: localStorage.getItem('token') || ''},
                    },
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
