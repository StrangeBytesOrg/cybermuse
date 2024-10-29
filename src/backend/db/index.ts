import path from 'node:path'
import {drizzle} from 'drizzle-orm/libsql/node'
import {migrate} from 'drizzle-orm/libsql/migrator'
import type {Logger} from 'drizzle-orm/logger'
import {env} from '../env.js'
import {paths} from '../paths.js'

import * as schema from './schema.js'
export * from './schema.js'
import {logger} from '../logging.js'

// Setup database logger
const dbLogger = logger.getSubLogger({
    name: 'db',
})
class DrizzleLogger implements Logger {
    logQuery(query: string, params: unknown[]): void {
        dbLogger.debug({query, params: params.join(',')})
    }
}

let databasePath = path.resolve(paths.config, 'app-data.db')
if (env.DEV) {
    databasePath = './dev.db'
}
logger.info(`Database file: ${databasePath}`)

export const db = drizzle({
    schema,
    logger: env.VERBOSE ? new DrizzleLogger() : undefined,
    connection: {url: `file:${databasePath}`},
})

if (env.DEV) {
    dbLogger.info('Dev mode, skipping migrations')
} else {
    dbLogger.info('Running migrations')
    migrate(db, {migrationsFolder: path.resolve(import.meta.dirname, './migrations')})
}
