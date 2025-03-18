import {db} from '@/db'
import client from '@/clients/sync-client'
import {useSettingsStore} from '@/store'
import {SignJWT} from 'jose'

export const sync = async () => {
    const settings = useSettingsStore()
    const baseUrl = settings.syncProvider === 'hub' ? import.meta.env.VITE_SYNC_URL : settings.syncServer
    let token
    if (settings.syncProvider === 'hub') {
        token = localStorage.getItem('token') ?? ''
    } else if (settings.syncProvider === 'self-hosted') {
        const secret = new TextEncoder().encode(settings.syncSecret ?? '')
        const user = import.meta.env.VITE_USER ?? 'default-user'
        token = await new SignJWT({sub: user}).setProtectedHeader({alg: 'HS256'}).sign(secret)
    } else {
        throw new Error('No sync provider selected')
    }

    if (!baseUrl) throw new Error('No sync server selected')
    if (!token) throw new Error('No token found')

    const {data: remoteDocs, error} = await client.GET('/list', {
        baseUrl,
        params: {header: {token}},
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
                    header: {token},
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
                    params: {header: {token}},
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
