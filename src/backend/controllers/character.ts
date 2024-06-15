import type {ZodTypeProvider} from 'fastify-type-provider-zod'
import type {FastifyPluginAsync} from 'fastify'
import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {Template} from '@huggingface/jinja'
import {db, character, selectCharacterSchema, insertCharacterSchema} from '../db.js'

export const characterRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/characters',
        method: 'GET',
        schema: {
            summary: 'Get all characters',
            response: {
                200: z.object({
                    characters: z.array(selectCharacterSchema),
                }),
            },
        },
        handler: async () => {
            const characters = await db.select().from(character)
            characters.forEach((character) => {
                const descriptionTemplate = new Template(character.description)
                character.description = descriptionTemplate.render({char: character.name})
            })
            return {characters}
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
                    character: selectCharacterSchema,
                }),
            },
        },
        handler: async (req) => {
            const resCharacter = await db.query.character.findFirst({where: eq(character.id, Number(req.params.id))})
            if (!resCharacter) {
                throw new Error('Character not found')
            }
            return {character: resCharacter}
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/create-character',
        method: 'POST',
        schema: {
            summary: 'Create a character',
            body: insertCharacterSchema,
        },
        handler: async (req) => {
            await db.insert(character).values({
                name: req.body.name,
                type: req.body.type,
                description: req.body.description,
                firstMessage: req.body.firstMessage,
                image: req.body.image,
            })
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/update-character/:id',
        method: 'POST',
        schema: {
            summary: 'Update a character',
            params: z.object({
                id: z.string(),
            }),
            body: insertCharacterSchema,
        },
        handler: async (req) => {
            await db
                .update(character)
                .set({
                    name: req.body.name,
                    type: req.body.type,
                    description: req.body.description,
                    firstMessage: req.body.firstMessage,
                    image: req.body.image,
                })
                .where(eq(character.id, Number(req.params.id)))
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/delete-character/:id',
        method: 'POST',
        schema: {
            summary: 'Delete a character',
            params: z.object({
                id: z.string(),
            }),
        },
        handler: async (req) => {
            if (req.params.id === '1') {
                throw new Error('Not allowed to delete the user character.')
            }
            await db.delete(character).where(eq(character.id, Number(req.params.id)))
        },
    })
}
