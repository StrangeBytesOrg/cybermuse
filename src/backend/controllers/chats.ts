import {z} from 'zod'
import {eq, inArray} from 'drizzle-orm'
import {Template} from '@huggingface/jinja'
import {TRPCError} from '@trpc/server'
import {t} from '../trpc.js'
import {logger} from '../logging.js'
import {db, Chat, ChatCharacters, Character, Message, ChatLore} from '../db/index.js'

export const chatRouter = t.router({
    getAll: t.procedure.query(async () => {
        const chats = await db.query.Chat.findMany({
            with: {characters: {with: {character: true}}},
        })
        return chats
    }),
    getById: t.procedure.input(z.number()).query(async ({input: id}) => {
        const chat = await db.query.Chat.findFirst({
            where: eq(Chat.id, Number(id)),
            with: {
                messages: true,
                characters: {with: {character: true}},
                lore: {with: {lore: true}},
            },
        })

        if (!chat) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Chat not found',
            })
        }

        return chat
    }),
    create: t.procedure
        .input(
            z.object({
                characters: z.array(z.number()),
                lore: z.array(z.number()),
            }),
        )
        .mutation(async ({input}) => {
            const {characters} = input
            if (characters.length === 0) {
                throw new Error('At least one character is required')
            }

            const [newChat] = await db.insert(Chat).values({}).returning({id: Chat.id})
            const chatCharacters = await db.query.Character.findMany({
                where: inArray(Character.id, characters),
            })
            const userCharacter = chatCharacters.find((character) => character.type === 'user')
            logger.debug(`User character: ${userCharacter?.name}`)

            // Add chat characters
            // TODO change to a multi insert
            for (let i = 0; i < characters.length; i += 1) {
                const characterId = characters[i]
                logger.debug(`Inserting character ${characterId} into chat ${newChat.id}`)
                await db.insert(ChatCharacters).values({
                    chatId: newChat.id,
                    characterId,
                })

                // If characters have a first message, add it
                const resCharacter = await db.query.Character.findFirst({
                    where: eq(Character.id, characterId),
                })
                if (resCharacter?.firstMessage) {
                    const firstMessage = new Template(resCharacter.firstMessage).render({
                        char: resCharacter.name,
                        user: userCharacter?.name || 'User',
                    })
                    await db
                        .insert(Message)
                        .values({
                            chatId: newChat.id,
                            characterId,
                            type: 'model',
                            activeIndex: 0,
                            content: [firstMessage],
                        })
                        .returning({id: Message.id})
                }
            }

            // Add chat lore
            // TODO change to a multi insert
            const {lore} = input
            for (let i = 0; i < lore.length; i += 1) {
                const loreId = lore[i]
                await db.insert(ChatLore).values({
                    chatId: newChat.id,
                    loreId,
                })
                logger.debug(`Adding lore: ${loreId} into chat: ${newChat.id}`)
            }

            return {id: newChat.id}
        }),
    delete: t.procedure.input(z.number()).mutation(async ({input: id}) => {
        await db.delete(Chat).where(eq(Chat.id, Number(id)))
    }),
})
