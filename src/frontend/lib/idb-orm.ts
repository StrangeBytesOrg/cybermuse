import {z} from 'zod'
import {type IDBPDatabase, type IDBPTransaction, openDB} from 'idb'
import {randomId} from './random-id'

type Tx = IDBPTransaction<unknown, string[], 'versionchange'>
export type Migrations = Record<number, (db: IDBPDatabase, tx: Tx) => Promise<void>>

const baseSchema = z.looseObject({
    id: z.string().min(1, {error: 'ID cannot be empty'}),
    lastUpdate: z.number().default(0),
    version: z.number().default(0),
})
export type BaseDocument = z.infer<typeof baseSchema>

const deletionSchema = z.object({
    id: z.string(),
    collection: z.string(),
    deletedAt: z.number(),
})
export type DeletionRecord = z.infer<typeof deletionSchema>

export function makeSchema<T extends z.ZodRawShape>(shape: T) {
    return z.object({
        id: z.string().optional().default(() => randomId()),
        lastUpdate: z.number().optional().default(() => Date.now()),
        version: z.number().default(0),
        ...shape,
    })
}

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
        this.version = options.version
        this.schema = options.schema
        this.migrations = options.migrations || {}
    }

    /** Get a document by its key. */
    async get(key: string | number) {
        const doc = await this.db.get(this.store, key)
        if (!doc) throw new Error(`Document not found: ${this.store}/${key}`)
        return this.schema.parse(doc)
    }

    /** Put a document into the collection. */
    async put(
        doc: Omit<z.infer<T>, 'id' | 'lastUpdate' | 'version'> & {id?: string; lastUpdate?: number},
        updateTimestamp = true,
    ) {
        if (updateTimestamp) {
            doc.lastUpdate = Date.now()
        }
        return await this.db.put(this.store, {
            version: this.version,
            ...this.schema.parse(doc),
        }) as string
    }

    /* Validate a document with the schema */
    validate(doc: unknown) {
        return this.schema.parse(doc)
    }

    /** Delete a document and record in deletions store */
    async delete(key: string | number) {
        const doc = await this.get(key) // Ensure it exists before deleting
        if (!doc) {
            console.warn(`Document not found for deletion: ${this.store}/${key}`)
            return
        }
        await this.db.delete(this.store, key)
        await this.db.put('deletions', {
            id: key.toString(),
            collection: this.store,
            deletedAt: Date.now(),
        })
    }

    /** List all documents in the collection. */
    async toArray() {
        const docs = await this.db.getAll(this.store)
        return docs.map((doc) => this.schema.parse(doc))
    }

    /** Get documents from an array of keys */
    async whereIn(keys: string[]) {
        if (!keys.length) return []

        const tx = this.db.transaction(this.store)
        const docs = await Promise.all(keys.map(k => tx.store.get(k)))
        await tx.done

        return docs.map(doc => this.schema.parse(doc))
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
        return {
            ...this.schema.parse(baseDoc),
            version: this.version,
            lastUpdate: Date.now(),
        }
    }

    /** Get deletions for this collection */
    async getDeletions() {
        const deletions = await this.db.getAll('deletions')
        return deletions.filter((d: DeletionRecord) => d.collection === this.store)
    }
}
