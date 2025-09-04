import {z} from 'zod'
import {type IDBPDatabase, type IDBPTransaction, openDB} from 'idb'

export type Migrations = Record<
    number,
    (db: IDBPDatabase, tx: IDBPTransaction<unknown, string[], 'versionchange'>) => Promise<void>
>

const baseSchema = z.looseObject({
    id: z.string().min(1, {error: 'ID cannot be empty'}),
    lastUpdate: z.number().default(0),
    version: z.number().default(0),
    deleted: z.number().optional(),
})
export type BaseDocument = z.infer<typeof baseSchema>

export function createDB(name: string, version: number, migrations: Migrations) {
    const versions = Object.keys(migrations)
        .map(n => Number(n))
        .filter(v => Number.isInteger(v) && v > 0)
        .sort((a, b) => a - b)

    return openDB(name, version, {
        // TODO Move into `initDB` function, and make migrations part of a class constructor or something for finer control over when migrations run
        async upgrade(db, oldVersion, newVersion, transaction) {
            console.log(`[idb-migrations] upgrade ${oldVersion} -> ${newVersion}`)
            try {
                for (const v of versions) {
                    if (v <= oldVersion) continue
                    if (typeof newVersion === 'number' && v > newVersion) break
                    const migration = migrations[v]
                    if (typeof migration !== 'function') {
                        throw new Error(`Migration for version ${v} is not a function`)
                    }
                    console.log(`[idb-migrations] running v${v}`)
                    await migration(db, transaction)
                }
                await transaction.done
                console.log('[idb-migrations] success')
            } catch (err) {
                console.error('[idb-migrations] Upgrade failed:', err)
                try {
                    transaction.abort()
                } catch {}
            }
        },
        blocked() {
            console.error(`[idb-migrations] Connection to ${name} blocked.`)
        },
        terminated() {
            console.error(`[idb-migrations] Connection to ${name} unexpectedly terminated.`)
        },
    })
}

export class Collection<T extends z.ZodObject<z.ZodRawShape>> {
    private db: IDBPDatabase
    public store: string
    public version: number
    public schema: T
    private migrations: Record<number, (doc: BaseDocument) => BaseDocument>

    constructor(options: {
        db: IDBPDatabase
        store: string
        version: number
        schema: T
        migrations?: Record<number, (doc: BaseDocument) => BaseDocument>
    }) {
        this.db = options.db
        this.store = options.store
        this.version = options.version || 1
        this.schema = options.schema
        this.migrations = options.migrations || {}
    }

    /** Get a document by its key. */
    async get(key: string | number) {
        return this.schema.parse(await this.db.get(this.store, key))
    }

    /** Put a document into the collection. */
    async put(doc: z.infer<T>, updateTimestamp = true) {
        return await this.db.put(
            this.store,
            this.schema.parse({
                ...doc,
                version: this.version,
                lastUpdate: updateTimestamp ? Date.now() : doc.lastUpdate,
            }),
        )
    }

    /** Update a document in the collection. */
    async update(
        key: string | number,
        doc: Partial<z.infer<T>>,
        options: {updateTimestamp?: boolean} = {updateTimestamp: true},
    ) {
        return await this.db.put(
            this.store,
            this.schema.parse({
                ...await this.get(key),
                ...doc,
                lastUpdate: options.updateTimestamp ? Date.now() : undefined,
            }),
        )
    }

    /** Convert document into a tombstone */
    async delete(key: string | number) {
        return await this.db.put(this.store, {id: key, lastUpdate: Date.now(), deleted: 1})
    }

    /** List all documents in the collection. */
    async toArray() {
        const docs = await this.db.getAll(this.store)
        return docs.filter(doc => !doc.deleted).map((doc) => this.schema.parse(doc))
    }

    /** Get documents from an array of keys */
    async whereIn(keys: string[]) {
        if (!keys.length) return []

        const tx = this.db.transaction(this.store)
        const docs = await Promise.all(keys.map(k => tx.store.get(k)))
        await tx.done

        return docs.filter(doc => !doc.deleted).map(doc => this.schema.parse(doc))
    }

    /** Migrate a document to a new version */
    async migrate(doc: unknown) {
        let baseDoc = baseSchema.parse(doc)
        Object.keys(this.migrations).forEach((v) => {
            const migration = this.migrations[Number(v)]
            if (migration && Number(v) > baseDoc.version) {
                baseDoc = migration(baseDoc)
            }
        })
        return this.schema.parse(baseDoc)
    }
}
