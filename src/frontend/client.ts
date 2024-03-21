import {initClient} from '@ts-rest/core'
import {contract} from '../backend/contract'

const serverPort = 31700
export const client = initClient(contract, {
    baseUrl: `http://localhost:${serverPort}/api`,
    baseHeaders: {},
})
