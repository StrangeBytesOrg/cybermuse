import type {ZodTypeProvider} from 'fastify-type-provider-zod'
import type {FastifyPluginAsync} from 'fastify'
import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {
    db,
    chat,
    chatCharacters,
    character,
    message,
    messageContent,
    selectChatSchema,
    selectMessageSchema,
    selectCharacterSchema,
    selectMessageContentSchema,
    selectChatCharactersSchema,
} from '../db.js'

export const chatRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/chats',
        method: 'GET',
        schema: {
            summary: 'Get all Chats',
            response: {
                200: z.object({
                    chats: z.array(
                        selectChatSchema.extend({
                            characters: z.array(
                                selectChatCharactersSchema.extend({
                                    character: selectCharacterSchema,
                                }),
                            ),
                        }),
                    ),
                }),
            },
        },
        handler: async () => {
            const chats = await db.query.chat.findMany({
                with: {characters: {with: {character: true}}},
            })
            if (!chats) {
                throw new Error('No chats found')
            }
            return {chats}
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
                    chat: selectChatSchema.extend({
                        messages: z.array(
                            selectMessageSchema.extend({
                                content: z.array(selectMessageContentSchema),
                            }),
                        ),
                    }),
                    characters: z.array(selectCharacterSchema),
                }),
            },
        },
        handler: async (req) => {
            const dbChat = await db.query.chat.findFirst({
                where: eq(chat.id, Number(req.params.id)),
                with: {
                    messages: {
                        with: {content: true},
                    },
                    characters: {with: {character: true}},
                },
            })

            const dbCharacters = dbChat?.characters.map((c) => {
                return c.character
            })

            if (!dbCharacters) {
                throw new Error('No characters found')
            }

            if (dbChat) {
                return {chat: dbChat, characters: dbCharacters}
            } else {
                throw new Error('Chat not found')
            }
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/create-chat',
        method: 'POST',
        schema: {
            summary: 'Create a Chat',
            body: z.object({
                characters: z.array(z.number()),
            }),
            response: {
                200: z.object({
                    id: z.number(),
                }),
            },
        },
        handler: async (req) => {
            const {characters} = req.body
            if (characters.length === 0) {
                throw new Error('At least one character is required')
            }

            const [newChat] = await db.insert(chat).values({}).returning({id: chat.id})

            // Add chat characters
            // TODO change to a multi insert
            for (let i = 0; i < characters.length; i += 1) {
                const characterId = characters[i]
                console.log('inserting', characterId)
                await db.insert(chatCharacters).values({
                    chatId: newChat.id,
                    characterId,
                })

                // If characters have a first message, add it
                const resCharacter = await db.query.character.findFirst({
                    where: eq(character.id, characterId),
                })
                if (resCharacter?.firstMessage) {
                    const [newMessage] = await db
                        .insert(message)
                        .values({
                            chatId: newChat.id,
                            characterId,
                            generated: 0,
                            activeIndex: 0,
                        })
                        .returning({id: message.id})
                    console.log(newMessage.id)
                    await db.insert(messageContent).values({
                        messageId: newMessage.id,
                        text: resCharacter.firstMessage,
                    })
                }
            }

            return {id: newChat.id}
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/delete-chat/:id',
        method: 'POST',
        schema: {
            summary: 'Delete a Chat',
            params: z.object({id: z.string()}),
        },
        handler: async (req) => {
            await db.delete(chat).where(eq(chat.id, Number(req.params.id)))
        },
    })
}
