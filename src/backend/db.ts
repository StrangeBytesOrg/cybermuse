import path from 'node:path'
import {drizzle} from 'drizzle-orm/better-sqlite3'
import {migrate} from 'drizzle-orm/better-sqlite3/migrator'
import type {Logger} from 'drizzle-orm/logger'
import Database from 'better-sqlite3'
import envPaths from 'env-paths'

import * as schema from './schema.js'
export * from './schema.js'
import {logger} from './logging.js'

const paths = envPaths('cybermuse-desktop', {suffix: ''})
let databasePath = path.resolve(paths.config, 'app-data.db')
if (process.env.DEV) {
    databasePath = path.resolve('./dev.db')
}

const dbLogger = logger.getSubLogger({
    name: 'db',
})
class DrizzleLogger implements Logger {
    logQuery(query: string, params: unknown[]): void {
        dbLogger.info({query, params: params.join(',')})
    }
}

const sqlite = new Database(databasePath)
export const db = drizzle(sqlite, {schema, logger: new DrizzleLogger()})

if (!process.env.DEV) {
    migrate(db, {migrationsFolder: path.resolve(import.meta.dirname, '../migrations')})
} else {
    console.log('DEV mode skipping migrations')
}
