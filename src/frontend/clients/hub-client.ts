import createClient from 'openapi-fetch'
import type {paths} from './hub-types'

export function createHubClient(token?: string | null) {
    const client = createClient<paths>({baseUrl: import.meta.env.VITE_HUB_URL})
    if (token) {
        client.use({
            onRequest: ({request}) => {
                request.headers.set('Authorization', `Bearer ${token}`)
            },
        })
    }
    return client
}
export default createHubClient()
