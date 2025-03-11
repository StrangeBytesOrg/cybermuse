import createClient from 'openapi-fetch'
import type {paths} from './sync-types'

export default createClient<paths>({baseUrl: import.meta.env.VITE_SYNC_URL})
