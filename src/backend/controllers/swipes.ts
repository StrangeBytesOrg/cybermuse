import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {t} from '../trpc.js'
import {db, Message} from '../db.js'
import {logger} from '../logging.js'
import {TRPCError} from '@trpc/server'

export const swipeRouter = t.router({
    newSwipe: t.procedure.input(z.number()).mutation(async ({input: messageId}) => {
        const message = await db.query.Message.findFirst({
            where: eq(Message.id, messageId),
        })
        if (!message) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Message not found',
            })
        }
        message.content.push('')
        logger.debug(`Message Id: ${messageId} Active Index: ${message.content.length - 1}`)
        await db
            .update(Message)
            .set({content: message.content, activeIndex: message.content.length - 1})
            .where(eq(Message.id, messageId))
    }),
    setSwipeIndex: t.procedure
        .input(
            z.object({
                messageId: z.number(),
                activeIndex: z.number().min(0),
            }),
        )
        .mutation(async ({input}) => {
            const {messageId, activeIndex} = input
            const message = await db.query.Message.findFirst({
                where: eq(Message.id, messageId),
            })
            if (!message) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Message not found',
                })
            }
            if (!message.content[activeIndex]) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Swipe does not exist',
                })
            }
            logger.debug(`Message Id: ${messageId} Active Index: ${activeIndex}`)
            await db.update(Message).set({activeIndex}).where(eq(Message.id, messageId))
        }),
})
