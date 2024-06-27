import {Elysia, t} from 'elysia'
import {eq} from 'drizzle-orm'
import {
    db,
    chat,
    chatCharacters,
    character,
    message,
    selectChatSchema,
    selectMessageSchema,
    selectCharacterSchema,
    selectChatCharactersSchema,
} from '../db.js'

export const chatRoutes = new Elysia()

chatRoutes.get(
    '/chats',
    async () => {
        const chats = await db.query.chat.findMany({
            with: {characters: {with: {character: true}}},
        })
        if (!chats) {
            throw new Error('No chats found')
        }
        return {chats}
    },
    {
        tags: ['chats'],
        detail: {
            operationId: 'GetAllChats',
            summary: 'Get all Chats',
        },
        response: {
            200: t.Object({
                chats: t.Array(
                    t.Object({
                        ...selectChatSchema.properties,
                        characters: t.Array(
                            t.Object({
                                ...selectChatCharactersSchema.properties,
                                character: selectCharacterSchema,
                            }),
                        ),
                    }),
                ),
            }),
        },
    },
)

chatRoutes.get(
    '/chat/:id',
    async ({params}) => {
        const dbChat = await db.query.chat.findFirst({
            where: eq(chat.id, Number(params.id)),
            with: {
                messages: true,
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
    {
        tags: ['chats'],
        detail: {
            operationId: 'GetChatById',
            summary: 'Get a Chat by ID',
        },
        params: t.Object({
            id: t.String(),
        }),
        response: {
            200: t.Object({
                chat: t.Object({
                    ...selectChatSchema.properties,
                    messages: t.Array(selectMessageSchema),
                }),
                characters: t.Array(selectCharacterSchema),
            }),
        },
    },
)

chatRoutes.post(
    '/create-chat',
    async ({body}) => {
        const {characters} = body
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
                await db
                    .insert(message)
                    .values({
                        chatId: newChat.id,
                        characterId,
                        generated: false,
                        activeIndex: 0,
                        content: [resCharacter.firstMessage],
                    })
                    .returning({id: message.id})
            }
        }

        return {id: newChat.id}
    },
    {
        tags: ['chats'],
        detail: {
            operationId: 'CreateChat',
            summary: 'Create a Chat',
        },
        body: t.Object({
            characters: t.Array(t.Number()),
        }),
        response: {
            200: t.Object({
                id: t.Number(),
            }),
        },
    },
)

chatRoutes.post(
    '/delete-chat/:id',
    async ({params}) => {
        await db.delete(chat).where(eq(chat.id, Number(params.id)))
    },
    {
        tags: ['chats'],
        detail: {
            operationId: 'DeleteChat',
            summary: 'Delete a Chat',
        },
        params: t.Object({id: t.String()}),
    },
)
