import url from 'node:url'
import path from 'node:path'
import {drizzle} from 'drizzle-orm/bun-sqlite'
import {migrate} from 'drizzle-orm/bun-sqlite/migrator'
import Database from 'bun:sqlite'
import envPaths from 'env-paths'

import * as schema from './schema.js'
export * from './schema.js'

const paths = envPaths('chat', {suffix: ''})
let databasePath = path.resolve(paths.config, 'app-data.db')
if (process.env.DEV) {
    databasePath = path.resolve('./dev.db')
}

const esmDirName = url.fileURLToPath(new URL('.', import.meta.url))
const sqlite = new Database(databasePath)
export const db = drizzle(sqlite, {schema, logger: true})

if (!process.env.DEV) {
    console.log(`Running migrations from ${path.resolve(esmDirName, '../migrations')}`)
    migrate(db, {migrationsFolder: path.resolve(esmDirName, '../migrations')})
} else {
    console.log('DEV mode skipping migrations')
}
