import createClient from 'openapi-fetch'
import type {paths} from './hub-types'

export default createClient<paths>({baseUrl: import.meta.env.VITE_HUB_URL})
