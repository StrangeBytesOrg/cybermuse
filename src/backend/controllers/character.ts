import type {ZodTypeProvider} from 'fastify-type-provider-zod'
import type {FastifyPluginAsync} from 'fastify'
import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {Template} from '@huggingface/jinja'
import {db, character} from '../db.js'

export const characterRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/characters',
        method: 'GET',
        schema: {
            summary: 'Get all characters',
            response: {
                200: z.array(
                    z.object({
                        id: z.number(),
                        name: z.string(),
                        description: z.string().nullable(),
                        firstMessage: z.string().nullable(),
                        image: z.string().nullable(),
                        type: z.enum(['user', 'character']),
                    }),
                ),
            },
        },
        handler: async () => {
            const characters = await db.select().from(character)
            characters.forEach((character) => {
                const descriptionTemplate = new Template(character.description)
                character.description = descriptionTemplate.render({char: character.name})
            })
            return characters
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/character/:id',
        method: 'GET',
        schema: {
            summary: 'Get a character by ID',
            params: z.object({
                id: z.string(),
            }),
            response: {
                200: z.object({
                    id: z.number(),
                    name: z.string(),
                    description: z.string(),
                    firstMessage: z.string().nullable(),
                    image: z.string().nullable(),
                    type: z.enum(['user', 'character']),
                }),
            },
        },
        handler: async (req) => {
            return await db.query.character.findFirst({where: eq(character.id, Number(req.params.id))})
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/create-character',
        method: 'POST',
        schema: {
            summary: 'Create a character',
            body: z.object({
                name: z.string(),
                description: z.string(),
                firstMessage: z.string().nullable(),
                image: z.string().nullable(),
                type: z.enum(['user', 'character']),
            }),
            response: {
                200: z.object({
                    success: z.boolean(),
                }),
            },
        },
        handler: async (req) => {
            await db.insert(character).values({
                name: req.body.name,
                description: req.body.description,
                firstMessage: req.body.firstMessage,
                image: req.body.image,
                type: req.body.type,
            })
            return {success: true}
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/update-character/',
        method: 'POST',
        schema: {
            summary: 'Update a character',
            body: z.object({
                id: z.number(),
                name: z.string(),
                description: z.string(),
                firstMessage: z.string().nullable(),
                image: z.string().nullable(),
            }),
            response: {
                200: z.object({
                    success: z.boolean(),
                }),
            },
        },
        handler: async (req) => {
            const result = await db
                .update(character)
                .set({
                    name: req.body.name,
                    description: req.body.description,
                    firstMessage: req.body.firstMessage,
                    image: req.body.image,
                })
                .where(eq(character.id, req.body.id))
            console.log(result)
            return {success: true}
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/delete-character/',
        method: 'POST',
        schema: {
            summary: 'Delete a character',
            body: z.object({
                id: z.number(),
            }),
            response: {
                200: z.object({
                    success: z.boolean(),
                }),
            },
        },
        handler: async (req) => {
            if (req.body.id === 1) {
                throw new Error('Not allowed to delete the user character.')
            }

            const result = await db.delete(character).where(eq(character.id, req.body.id))
            console.log(result)
            return {success: true}
        },
    })
}
