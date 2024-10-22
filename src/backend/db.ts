import path from 'node:path'
import {drizzle} from 'drizzle-orm/better-sqlite3'
import {migrate} from 'drizzle-orm/better-sqlite3/migrator'
import type {Logger} from 'drizzle-orm/logger'
import Database from 'better-sqlite3'
import {env} from './env.js'
import {paths} from './paths.js'

import * as schema from './schema.js'
export * from './schema.js'
import {logger} from './logging.js'

let databasePath = path.resolve(paths.config, 'app-data.db')
if (env.DEV) {
    databasePath = './dev.db'
}
logger.info(`Database file: ${databasePath}`)

const dbLogger = logger.getSubLogger({
    name: 'db',
})
class DrizzleLogger implements Logger {
    logQuery(query: string, params: unknown[]): void {
        dbLogger.debug({query, params: params.join(',')})
    }
}

const sqlite = new Database(databasePath)
export const db = drizzle(sqlite, {schema, logger: env.VERBOSE ? new DrizzleLogger() : undefined})

if (!env.DEV) {
    migrate(db, {migrationsFolder: path.resolve(import.meta.dirname, '../migrations')})
} else {
    dbLogger.info('Dev mode, skipping migrations')
}
