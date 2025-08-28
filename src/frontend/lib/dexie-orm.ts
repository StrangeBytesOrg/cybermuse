import {z} from 'zod'
import Dexie from 'dexie'

/** A strongly-typed collection wrapper for Dexie documents validated by Zod schemas. */
export class Collection<T extends z.ZodObject<z.ZodRawShape>> {
    constructor(
        private table: Dexie.Table,
        public schema: T,
    ) {}

    /** Get a document by its key. */
    async get(key: string): Promise<z.infer<T>> {
        return this.schema.parse(await this.table.get(key))
    }

    /** Put a document into the collection. */
    async put(doc: z.infer<T>) {
        return await this.table.put(this.schema.parse(doc))
    }

    /** Update a document in the collection. */
    async update(key: string, doc: Partial<z.infer<T>>) {
        return await this.table.update(key, this.schema.partial().parse(doc))
    }

    /** Convert document into a tombstone */
    async delete(key: string) {
        return await this.table.put({id: key, lastUpdate: Date.now(), deleted: 1})
    }

    /** List all documents in the collection. */
    async toArray(): Promise<z.infer<T>[]> {
        const docs = await this.table.filter(doc => !doc.deleted).toArray()
        return docs.map(doc => this.schema.parse(doc))
    }

    /** Get documents in an array */
    async whereIn(keys: string[]): Promise<z.infer<T>[]> {
        const docs = (await this.table.bulkGet(keys)).filter(doc => !doc.deleted)
        return docs.map(doc => this.schema.parse(doc))
    }

    /** Return documents by order */
    orderBy(field: string) {
        return {
            toArray: async (): Promise<z.infer<T>[]> => {
                const docs = await this.table.orderBy(field).filter(doc => !doc.deleted).toArray()
                return docs.map(doc => this.schema.parse(doc))
            },
        }
    }
}
