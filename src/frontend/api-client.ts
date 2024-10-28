import {createTRPCClient, httpBatchLink, unstable_httpBatchStreamLink, TRPCClientError} from '@trpc/client'
import type {AppRouter} from '../backend/router'

export const client = createTRPCClient<AppRouter>({
    links: [
        httpBatchLink({
            url: '/trpc',
        }),
    ],
})

export const streamingClient = createTRPCClient<AppRouter>({
    links: [
        unstable_httpBatchStreamLink({
            url: '/trpc',
        }),
    ],
})

// export type Err = TRPCClientError<AppRouter>
export function isTRPCClientError(cause: unknown): cause is TRPCClientError<AppRouter> {
    return cause instanceof TRPCClientError
}
