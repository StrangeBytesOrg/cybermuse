import {
    createTRPCClient,
    splitLink,
    httpBatchLink,
    unstable_httpBatchStreamLink,
    unstable_httpSubscriptionLink,
    TRPCClientError,
} from '@trpc/client'
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
        splitLink({
            condition: (op) => op.type === 'subscription',
            true: unstable_httpSubscriptionLink({
                url: '/trpc',
            }),
            false: unstable_httpBatchStreamLink({
                url: '/trpc',
            }),
        }),
    ],
})

// export type Err = TRPCClientError<AppRouter>
export function isTRPCClientError(cause: unknown): cause is TRPCClientError<AppRouter> {
    return cause instanceof TRPCClientError
}
