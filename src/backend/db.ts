import url from 'node:url'
import path from 'node:path'
import {drizzle} from 'drizzle-orm/better-sqlite3'
import {migrate} from 'drizzle-orm/better-sqlite3/migrator'
import Database from 'better-sqlite3'
import appDataPath from './app-data.js'

import * as schema from './schema.js'
export * from './schema.js'

const databasePath = path.resolve(appDataPath, 'app-data.db')

const esmDirName = url.fileURLToPath(new URL('.', import.meta.url))
const sqlite = new Database(databasePath)
export const db = drizzle(sqlite, {schema, logger: true})
migrate(db, {migrationsFolder: path.resolve(esmDirName, '../migrations')})
