import {defineConfig} from 'drizzle-kit'

export default defineConfig({
    dialect: 'sqlite',
    schema: './src/backend/db/schema.ts',
    out: './src/backend/db/migrations',
    dbCredentials: {
        url: 'file:dev.db',
    },
    verbose: true,
})
