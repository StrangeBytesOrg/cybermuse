import createClient from 'openapi-fetch'
import type {paths} from './api.d.ts'

let baseUrl = '/api'

// If we are running in Wails or in development mode, we need to change the base URL
if (window.location.protocol === 'file:') {
    baseUrl = 'http://localhost:31700/api'
} else if (window.location.port === '5173') {
    baseUrl = 'http://localhost:31700/api'
}

export const client = createClient<paths>({
    baseUrl,
})

// Fix for sending empty body
// TODO remove when these are fixed
// https://github.com/drwpow/openapi-typescript/issues/1694
// https://github.com/openapi-ts/openapi-typescript/pull/1702
client.use({
    onRequest: ({request}) => {
        if (request.body === null) {
            request.headers.delete('Content-Type')
        }
        return request
    },
})
