import createClient from 'openapi-fetch'
import type {paths} from './api.d.ts'

let baseUrl = '/api'

// If we are running in Wails or in development mode, we need to change the base URL
if (window.location.protocol === 'wails:') {
    baseUrl = 'http://localhost:31700/api'
} else if (window.location.port === '5173') {
    baseUrl = 'http://localhost:31700/api'
}

export const client = createClient<paths>({
    baseUrl,
})
