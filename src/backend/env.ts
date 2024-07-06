import {createEnv} from '@t3-oss/env-core'
import {z} from 'zod'

export const env = createEnv({
    server: {
        DEV: z
            .string()
            .transform((v) => v !== 'false' && v !== '0')
            .optional(),
        VERBOSE: z
            .string()
            .transform((v) => v !== 'false' && v !== '0')
            .optional(),
        LLAMA_SERVER_URL: z.string().url().optional(),
    },
    runtimeEnv: process.env,
})
