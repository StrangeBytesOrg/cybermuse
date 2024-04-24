import type {ZodTypeProvider} from 'fastify-type-provider-zod'
import type {FastifyPluginAsync} from 'fastify'
import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {db, chat, chatCharacters} from '../db.js'

export const chatRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/create-chat',
        method: 'POST',
        schema: {
            summary: 'Create a Chat',
            body: z.object({
                characters: z.array(z.number()),
                userCharacter: z.number(),
            }),
            response: {
                200: z.object({
                    id: z.number(),
                }),
            },
        },
        handler: async (req) => {
            const {characters, userCharacter} = req.body
            const [newChat] = await db.insert(chat).values({userCharacter}).returning({id: chat.id})

            if (characters.length === 0) {
                throw new Error('At least one character is required')
            }

            // Add chat characters
            // TODO change to a multi insert
            for (let i = 0; i < characters.length; i += 1) {
                const characterId = characters[i]
                console.log('inserting', characterId)
                await db.insert(chatCharacters).values({
                    chatId: newChat.id,
                    characterId,
                })
            }

            // Add user character
            await db.insert(chatCharacters).values({chatId: newChat.id, characterId: userCharacter})
            return {id: newChat.id}
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/chats',
        method: 'GET',
        schema: {
            summary: 'Get all Chats',
            response: {
                200: z.array(
                    z.object({
                        id: z.number(),
                        createdAt: z.number(),
                        updatedAt: z.number(),
                        chatCharacters: z.array(
                            z.object({
                                characterId: z.number().nullable(),
                            }),
                        ),
                    }),
                ),
            },
        },
        handler: async () => {
            const chats = await db.query.chat.findMany({
                with: {chatCharacters: true},
            })
            return chats
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/chat/:id',
        method: 'GET',
        schema: {
            summary: 'Get a Chat by ID',
            params: z.object({
                id: z.string(),
            }),
            response: {
                200: z.object({
                    id: z.number(),
                    createdAt: z.number(),
                    updatedAt: z.number(),
                    messages: z.array(
                        z.object({
                            id: z.number(),
                            text: z.string(),
                            characterId: z.number().nullable(),
                        }),
                    ),
                    chatCharacters: z.array(
                        z.object({
                            character: z.object({
                                id: z.number(),
                                name: z.string(),
                                image: z.string().nullable(),
                            }),
                        }),
                    ),
                }),
            },
        },
        handler: async (req) => {
            const dbChat = await db.query.chat.findFirst({
                where: eq(chat.id, Number(req.params.id)),
                with: {
                    messages: true,
                    chatCharacters: {
                        with: {character: true},
                        columns: {chatId: false},
                    },
                },
            })

            if (dbChat) {
                return dbChat
            } else {
                throw new Error('Chat not found')
            }
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/delete-chat',
        method: 'POST',
        schema: {
            summary: 'Delete a Chat',
            body: z.object({
                id: z.number(),
            }),
            response: {
                200: z.object({success: z.boolean()}),
            },
        },
        handler: async (req) => {
            await db.delete(chat).where(eq(chat.id, req.body.id))
            return {success: true}
        },
    })
}
