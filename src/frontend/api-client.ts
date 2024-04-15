import createClient from 'openapi-fetch'
import type {paths} from './api.d.ts'

// TODO use url from the connection store
export const client = createClient<paths>({
    baseUrl: 'http://localhost:31700',
})
