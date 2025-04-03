import createClient from 'openapi-fetch'
import type {paths} from './gen-types'
import {useHubStore} from '@/store'

const genClient = createClient<paths>()
genClient.use({
    onRequest: ({request}) => {
        const hub = useHubStore()
        if (hub.token) {
            request.headers.set('Authorization', `Bearer ${hub.token}`)
        }
    },
})
export default genClient
