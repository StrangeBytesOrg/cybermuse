import createClient from 'openapi-fetch'
import type {paths} from './sync-types'
import {useHubStore, useSettingsStore} from '@/store'

export function createSyncClient(baseUrl: string) {
    const client = createClient<paths>({baseUrl})
    client.use({
        onRequest: ({request}) => {
            const settings = useSettingsStore()
            const hub = useHubStore()
            const token = settings.syncProvider === 'hub' ? hub.token : settings.syncSecret
            if (!token) {
                throw new Error('No sync token set')
            }
            request.headers.set('Authorization', `Bearer ${token}`)
        },
    })
    return client
}
