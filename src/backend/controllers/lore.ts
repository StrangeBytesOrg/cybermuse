import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox'
import type {FastifyPluginAsync} from 'fastify'
import {Type as t} from '@sinclair/typebox'
import {logger} from '../logging.js'
import {eq} from 'drizzle-orm'
import {db, Lore, selectLoreSchema, insertLoreSchema} from '../db.js'

export const loreRoutes: FastifyPluginAsync = async (fastify) => {
    const f = fastify.withTypeProvider<TypeBoxTypeProvider>()
    f.route({
        url: '/lore',
        method: 'GET',
        schema: {
            operationId: 'GetLore',
            tags: ['lore'],
            summary: 'Get all Lore',
            response: {
                200: t.Array(selectLoreSchema),
            },
        },
        handler: async () => {
            const lore = await db.query.Lore.findMany()
            return lore
        },
    })

    f.route({
        url: '/lore/:id',
        method: 'GET',
        schema: {
            operationId: 'GetLoreById',
            tags: ['lore'],
            summary: 'Get a Lore by ID',
            params: t.Object({
                id: t.String(),
            }),
            response: {
                200: selectLoreSchema,
            },
        },
        handler: async (request) => {
            const lore = await db.query.Lore.findFirst({
                where: eq(Lore.id, Number(request.params.id)),
            })
            if (!lore) {
                throw new Error('Lore not found')
            }
            return lore
        },
    })

    f.route({
        url: '/create-lore',
        method: 'POST',
        schema: {
            operationId: 'CreateNewLore',
            tags: ['lore'],
            summary: 'Create a new Lore',
            body: t.Object({
                lore: insertLoreSchema,
            }),
            response: {
                200: t.Object({
                    id: t.Number(),
                }),
            },
        },
        handler: async (request) => {
            const {name, entries} = request.body.lore
            const [newLore] = await db.insert(Lore).values({name, entries}).returning({id: Lore.id})
            return {id: newLore.id}
        },
    })

    f.route({
        url: '/update-lore/:id',
        method: 'POST',
        schema: {
            operationId: 'UpdateLore',
            tags: ['lore'],
            summary: 'Update a Lore by ID',
            params: t.Object({
                id: t.String(),
            }),
            body: t.Object({
                lore: insertLoreSchema,
            }),
        },
        handler: async (request) => {
            const lore = await db.query.Lore.findFirst({
                where: eq(Lore.id, Number(request.params.id)),
            })
            if (!lore) {
                throw new Error('Lore not found')
            }
            const {name, entries} = request.body.lore
            await db.update(Lore).set({name, entries}).where(eq(Lore.id, lore.id))
            logger.debug('Updated lore', lore.id)
        },
    })

    f.route({
        url: '/delete-lore/:id',
        method: 'POST',
        schema: {
            operationId: 'DeleteLore',
            tags: ['lore'],
            summary: 'Delete a Lore by ID',
            params: t.Object({
                id: t.String(),
            }),
            response: {
                200: t.Object({
                    id: t.Number(),
                }),
            },
        },
        handler: async (request) => {
            const lore = await db.query.Lore.findFirst({
                where: eq(Lore.id, Number(request.params.id)),
            })
            if (!lore) {
                throw new Error('Lore not found')
            }
            await db.delete(Lore).where(eq(Lore.id, lore.id))
            logger.debug('Deleted lore', lore.id)
            return {id: lore.id}
        },
    })
}
