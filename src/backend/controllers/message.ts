import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {TRPCError} from '@trpc/server'
import {t} from '../trpc.js'
import {db, Message, insertMessageSchema} from '../db/index.js'
import {logger} from '../logging.js'

export const messageRouter = t.router({
    create: t.procedure.input(insertMessageSchema).mutation(async ({input}) => {
        const {chatId, characterId, type, content} = input
        logger.debug(
            'creating message',
            `chatId: ${chatId} characterId: ${characterId} type: ${type} content: ${content}`,
        )
        try {
            const [newMessage] = await db
                .insert(Message)
                .values({chatId, characterId, type, content, activeIndex: 0})
                .returning({id: Message.id})
            return {messageId: newMessage.id}
        } catch (err) {
            logger.error(err)
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to create message',
            })
        }
    }),
    update: t.procedure
        .input(
            z.object({
                id: z.number(),
                text: z.string(),
            }),
        )
        .mutation(async ({input}) => {
            const message = await db.query.Message.findFirst({
                where: eq(Message.id, input.id),
            })
            if (!message) {
                throw new Error('Message not found')
            }
            const content = message.content
            content[message.activeIndex] = input.text
            await db.update(Message).set({content}).where(eq(Message.id, input.id))
        }),
    delete: t.procedure.input(z.number()).mutation(async ({input: messageId}) => {
        await db.delete(Message).where(eq(Message.id, messageId))
    }),
})
