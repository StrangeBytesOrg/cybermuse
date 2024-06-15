import type {Config} from 'drizzle-kit'

export default {
    dialect: 'sqlite',
    schema: './src/backend/schema.ts',
    out: './src/migrations/',
    dbCredentials: {
        url: './dev.db',
    },
    verbose: true,
    strict: false, // Don't ask for confirmation before running migrations
} satisfies Config
