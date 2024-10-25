import {createTRPCClient, httpBatchLink} from '@trpc/client'
import type {AppRouter} from '../backend/router'

export const client = createTRPCClient<AppRouter>({
    links: [
        httpBatchLink({
            url: 'http://localhost:31700/trpc',
        }),
    ],
})
