import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {t} from '../trpc.js'
import {logger} from '../logging.js'
import {db, Lore, insertLoreSchema} from '../db.js'
import {TRPCError} from '@trpc/server'

export const loreRouter = t.router({
    getAll: t.procedure.query(async () => {
        const lore = await db.query.Lore.findMany()
        return lore
    }),
    getById: t.procedure.input(z.number()).query(async ({input: id}) => {
        const lore = await db.query.Lore.findFirst({
            where: eq(Lore.id, id),
        })
        if (!lore) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Lore not found',
            })
        }
        return lore
    }),
    create: t.procedure.input(insertLoreSchema).mutation(async ({input}) => {
        const {name, entries} = input
        const [newLore] = await db.insert(Lore).values({name, entries}).returning({id: Lore.id})
        return {id: newLore.id}
    }),
    update: t.procedure.input(insertLoreSchema).mutation(async ({input}) => {
        const lore = await db.query.Lore.findFirst({
            where: eq(Lore.id, Number(input.id)),
        })
        if (!lore) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Lore not found',
            })
        }
        const {name, entries} = input
        await db.update(Lore).set({name, entries}).where(eq(Lore.id, lore.id))
        logger.debug('Updated lore', lore.id)
    }),
    delete: t.procedure.input(z.number()).mutation(async ({input: id}) => {
        const lore = await db.query.Lore.findFirst({
            where: eq(Lore.id, id),
        })
        if (!lore) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Lore not found',
            })
        }
        await db.delete(Lore).where(eq(Lore.id, lore.id))
        logger.debug('Deleted lore', lore.id)
    }),
})
