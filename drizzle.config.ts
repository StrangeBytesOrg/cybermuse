import type {Config} from 'drizzle-kit'

export default {
    schema: './src/backend/schema.ts',
    out: './migrations',
    driver: 'better-sqlite',
    dbCredentials: {
        url: './app-data.db',
    },
    verbose: true,
    strict: false,
} satisfies Config
