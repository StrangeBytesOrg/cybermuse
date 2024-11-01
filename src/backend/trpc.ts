import {initTRPC} from '@trpc/server'
import {CreateFastifyContextOptions} from '@trpc/server/adapters/fastify'

export function createContext({req, res}: CreateFastifyContextOptions) {
    const userId = 1
    return {req, res, userId}
}
export type Context = Awaited<ReturnType<typeof createContext>>

export const t = initTRPC.context<typeof createContext>().create()
