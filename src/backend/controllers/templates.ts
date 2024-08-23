import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox'
import type {FastifyPluginAsync} from 'fastify'
import {Type as t} from '@sinclair/typebox'
import {eq} from 'drizzle-orm'
import {Template} from '@huggingface/jinja'
import {db, User, PromptTemplate, selectPromptTemplateSchema} from '../db.js'
import {logger} from '../logging.js'

export const templateRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/templates',
        method: 'GET',
        schema: {
            summary: 'Get all prompt templates',
            operationId: 'GetAllPromptTemplates',
            tags: ['templates'],
            response: {
                200: t.Object({
                    templates: t.Array(selectPromptTemplateSchema),
                    activeTemplateId: t.Number(),
                }),
            },
        },
        handler: async () => {
            const templates = await db.query.PromptTemplate.findMany()
            const user = await db.query.User.findFirst({
                with: {promptTemplate: true},
            })
            if (!templates) {
                throw new Error('No templates found')
            }
            if (!user || !user.promptTemplate) {
                throw new Error('No user found or no active template set')
            }
            return {templates, activeTemplateId: user.promptTemplate.id}
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/template/:id',
        method: 'GET',
        schema: {
            summary: 'Get a prompt template',
            operationId: 'GetPromptTemplateById',
            tags: ['templates'],
            params: t.Object({
                id: t.String(),
            }),
            response: {
                200: t.Object({template: selectPromptTemplateSchema}),
            },
        },
        handler: async (req) => {
            const template = await db.query.PromptTemplate.findFirst({
                where: eq(PromptTemplate.id, Number(req.params.id)),
            })
            if (!template) {
                throw new Error('Template not found')
            }
            return {template}
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/create-template',
        method: 'POST',
        schema: {
            summary: 'Create a prompt template',
            operationId: 'CreatePromptTemplate',
            tags: ['templates'],
            body: t.Object({
                name: t.String({minLength: 1}),
                instructTemplate: t.String({minLength: 1}),
                chatTemplate: t.String({minLength: 1}),
                chatInstruction: t.String({minLength: 1}),
            }),
            response: {
                200: t.Object({id: t.Number()}),
            },
        },
        handler: async (req) => {
            const [newTemplate] = await db
                .insert(PromptTemplate)
                .values({
                    name: req.body.name,
                    instructTemplate: req.body.instructTemplate,
                    chatTemplate: req.body.chatTemplate,
                    chatInstruction: req.body.chatInstruction,
                })
                .returning({id: PromptTemplate.id})
            await db.update(User).set({promptTemplate: newTemplate.id}).where(eq(User.id, 1))
            return {id: newTemplate.id}
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/update-template/:id',
        method: 'POST',
        schema: {
            summary: 'Update a prompt template',
            operationId: 'UpdatePromptTemplate',
            tags: ['templates'],
            params: t.Object({
                id: t.String({pattern: '^[0-9]+$'}),
            }),
            body: t.Object({
                name: t.String(),
                instructTemplate: t.String({minLength: 1}),
                chatTemplate: t.String({minLength: 1}),
                chatInstruction: t.String({minLength: 1}),
            }),
        },
        handler: async (req, reply) => {
            const {changes} = await db
                .update(PromptTemplate)
                .set({
                    name: req.body.name,
                    instructTemplate: req.body.instructTemplate,
                    chatTemplate: req.body.chatTemplate,
                    chatInstruction: req.body.chatInstruction,
                })
                .where(eq(PromptTemplate.id, Number(req.params.id)))
            if (changes === 0) {
                return reply.status(404).send({message: 'Template not found'})
            }
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/delete-template/:id',
        method: 'POST',
        schema: {
            summary: 'Delete a prompt template',
            operationId: 'DeletePromptTemplate',
            tags: ['templates'],
            params: t.Object({
                id: t.String({pattern: '^[0-9]+$'}),
            }),
        },
        handler: async (req, reply) => {
            if (req.params.id === '1') {
                return reply.status(400).send({message: 'Cannot delete the default template'})
            }
            await db.update(User).set({promptTemplate: 1}).where(eq(User.id, 1))
            await db.delete(PromptTemplate).where(eq(PromptTemplate.id, Number(req.params.id)))
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/set-active-template/:id',
        method: 'POST',
        schema: {
            summary: 'Set active prompt template',
            operationId: 'SetActivePromptTemplate',
            tags: ['templates'],
            params: t.Object({
                id: t.String({pattern: '^[0-9]+$'}),
            }),
        },
        handler: async (req, reply) => {
            const {changes} = await db
                .update(User)
                .set({promptTemplate: Number(req.params.id)})
                .where(eq(User.id, 1))
            if (changes === 0) {
                // TODO handle other reasons for this to fail
                return reply.status(404).send({message: 'User not found'})
            }
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/parse-template',
        method: 'POST',
        schema: {
            summary: 'Parse a prompt template',
            operationId: 'ParsePromptTemplate',
            tags: ['templates'],
            body: t.Object({
                chatTemplate: t.String({minLength: 1}),
                instructTemplate: t.String({minLength: 1}),
                chatInstruction: t.String({minLength: 1}),
                messages: t.Array(t.Any()),
                characters: t.Array(t.Any()),
                instructMessages: t.Array(t.Any()),
            }),
            response: {
                200: t.Object({
                    chatExample: t.String(),
                    instructExample: t.String(),
                }),
            },
        },
        handler: async (req) => {
            const chatTemplate = new Template(req.body.chatTemplate)
            const instructTemplate = new Template(req.body.instructTemplate)
            const chatInstructionTemplate = new Template(req.body.chatInstruction)

            const chatInstruction = chatInstructionTemplate.render({
                characters: req.body.characters,
            })
            logger.info('Parsed chat instruction:', chatInstruction)

            const chatExample = chatTemplate.render({
                instruction: chatInstruction,
                messages: req.body.messages,
            })
            const instructExample = instructTemplate.render({
                messages: req.body.instructMessages,
            })
            return {
                chatExample,
                instructExample,
            }
        },
    })
}
