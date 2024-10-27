import {initTRPC} from '@trpc/server'
import {CreateFastifyContextOptions} from '@trpc/server/adapters/fastify'

export function createContext({req, res}: CreateFastifyContextOptions) {
    return {req, res}
}
export type Context = Awaited<ReturnType<typeof createContext>>

export const t = initTRPC.create()
