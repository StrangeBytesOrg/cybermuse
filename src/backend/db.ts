import path from 'node:path'
import {drizzle} from 'drizzle-orm/better-sqlite3'
import {migrate} from 'drizzle-orm/better-sqlite3/migrator'
import Database from 'better-sqlite3'
import envPaths from 'env-paths'

import * as schema from './schema.js'
export * from './schema.js'

const paths = envPaths('chat', {suffix: ''})
let databasePath = path.resolve(paths.config, 'app-data.db')
if (process.env.DEV) {
    databasePath = path.resolve('./dev.db')
}

const sqlite = new Database(databasePath)
export const db = drizzle(sqlite, {schema, logger: true})

if (!process.env.DEV) {
    migrate(db, {migrationsFolder: path.resolve(import.meta.dirname, '../migrations')})
} else {
    console.log('DEV mode skipping migrations')
}
