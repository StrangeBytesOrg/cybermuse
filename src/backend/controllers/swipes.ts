import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox'
import {type FastifyPluginAsync} from 'fastify'
import {Type as t} from '@sinclair/typebox'
import {eq} from 'drizzle-orm'
import {db, Message} from '../db.js'

export const swipeRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/new-swipe',
        method: 'POST',
        schema: {
            operationId: 'NewSwipe',
            tags: ['swipes'],
            summary: 'Add a new swipe to the message',
            body: t.Object({messageId: t.Number()}),
        },
        handler: async (req, reply) => {
            const messageId = req.body.messageId
            const message = await db.query.Message.findFirst({
                where: eq(Message.id, messageId),
            })
            if (!message) {
                return reply.status(404).send({
                    error: 'Not Found',
                    message: 'Message not found',
                })
            }
            message.content.push('')
            console.log(`Active Index: ${message.content.length - 1}`)
            await db
                .update(Message)
                .set({content: message.content, activeIndex: message.content.length - 1})
                .where(eq(Message.id, messageId))
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/set-swipe-index',
        method: 'POST',
        schema: {
            operationId: 'SetSwipeIndex',
            tags: ['swipes'],
            summary: "Set a message's active swipe index",
            body: t.Object({
                messageId: t.Number(),
                activeIndex: t.Number({minimum: 0}),
            }),
        },
        handler: async (req, reply) => {
            const {messageId, activeIndex} = req.body
            const message = await db.query.Message.findFirst({
                where: eq(Message.id, messageId),
            })
            if (!message) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Message not found',
                })
            }
            if (!message.content[activeIndex]) {
                return reply.status(404).send({error: 'Not Found', message: 'Swipe does not exist'})
            }
            console.log(`Active Index: ${activeIndex}`)
            await db.update(Message).set({activeIndex}).where(eq(Message.id, messageId))
        },
    })
}
