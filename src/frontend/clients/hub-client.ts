import createClient from 'openapi-fetch'
import type {paths} from './hub-types'
import {useHubStore} from '@/store'

const hubClient = createClient<paths>({baseUrl: import.meta.env.VITE_HUB_URL})
hubClient.use({
    onRequest: ({request}) => {
        const hub = useHubStore()
        if (hub.token) {
            request.headers.set('Authorization', `Bearer ${hub.token}`)
        }
    },
})
export default hubClient
