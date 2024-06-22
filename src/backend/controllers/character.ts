import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox'
import type {FastifyPluginAsync} from 'fastify'
import {Type as t} from '@sinclair/typebox'
import {eq} from 'drizzle-orm'
import {Template} from '@huggingface/jinja'
import {db, character, selectCharacterSchema, insertCharacterSchema} from '../db.js'

export const characterRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/characters',
        method: 'GET',
        schema: {
            operationId: 'GetAllCharacters',
            tags: ['characters'],
            summary: 'Get all characters',
            response: {
                200: t.Object({
                    characters: t.Array(selectCharacterSchema),
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

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/character/:id',
        method: 'GET',
        schema: {
            operationId: 'GetCharacterById',
            tags: ['characters'],
            summary: 'Get a character by ID',
            params: t.Object({
                id: t.String(),
            }),
            response: {
                200: t.Object({
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

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/create-character',
        method: 'POST',
        schema: {
            operationId: 'CreateCharacter',
            tags: ['characters'],
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

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/update-character/:id',
        method: 'POST',
        schema: {
            operationId: 'UpdateCharacter',
            tags: ['characters'],
            summary: 'Update a character',
            params: t.Object({
                id: t.String(),
            }),
            body: insertCharacterSchema,
            response: {
                // 400: t.Object({
                //     message: t.String(),
                // }),
                200: t.Object({
                    id: t.Number(),
                }),
            },
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

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/delete-character/:id',
        method: 'POST',
        schema: {
            operationId: 'DeleteCharacter',
            tags: ['characters'],
            summary: 'Delete a character',
            params: t.Object({
                id: t.String(),
            }),
            response: {
                204: {type: 'null', description: 'No Content'},
            },
        },
        handler: async (req) => {
            if (req.params.id === '1') {
                throw new Error('Not allowed to delete the user character.')
            }
            await db.delete(character).where(eq(character.id, Number(req.params.id)))
        },
    })
}
