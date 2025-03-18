import createClient from 'openapi-fetch'
import type {paths} from './gen-types'

export default createClient<paths>()
