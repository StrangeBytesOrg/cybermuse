import {z} from 'zod'
import type {IDBPDatabase} from 'idb'

export class Collection<T extends z.ZodObject<z.ZodRawShape>> {
    constructor(
        private db: IDBPDatabase,
        private store: string,
        public schema: T,
    ) {}

    /** Get a document by its key. */
    async get(key: string | number) {
        return this.schema.parse(await this.db.get(this.store, key))
    }

    /** Put a document into the collection. */
    async put(doc: z.infer<T>) {
        return await this.db.put(
            this.store,
            this.schema.parse({...doc, lastUpdate: Date.now()}),
        )
    }

    /** Update a document in the collection. */
    async update(key: string | number, doc: Partial<z.infer<T>>) {
        return await this.db.put(
            this.store,
            this.schema.parse({...await this.get(key), ...doc, lastUpdate: Date.now()}),
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
}
