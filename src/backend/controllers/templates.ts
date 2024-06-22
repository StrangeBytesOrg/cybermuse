import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox'
import type {FastifyPluginAsync} from 'fastify'
import {Type as t} from '@sinclair/typebox'
import {eq} from 'drizzle-orm'
import {db, user, promptTemplate, selectPromptTemplateSchema} from '../db.js'

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
            const dbTemplates = await db.query.promptTemplate.findMany()
            const dbUser = await db.query.user.findFirst({
                with: {promptTemplate: true},
            })
            if (!dbTemplates) {
                throw new Error('No templates found')
            }
            if (!dbUser || !dbUser.promptTemplate) {
                throw new Error('No user found')
            }
            return {templates: dbTemplates, activeTemplateId: dbUser.promptTemplate.id}
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
            const dbTemplate = await db.query.promptTemplate.findFirst({
                where: eq(promptTemplate.id, Number(req.params.id)),
            })
            if (!dbTemplate) {
                throw new Error('Template not found')
            }
            return {template: dbTemplate}
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
                name: t.String(),
                content: t.String(),
            }),
            response: {
                200: t.Object({id: t.Number()}),
            },
        },
        handler: async (req) => {
            const [newTemplate] = await db
                .insert(promptTemplate)
                .values({name: req.body.name, content: req.body.content})
                .returning({id: promptTemplate.id})
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
                id: t.String(),
            }),
            body: t.Object({
                name: t.String(),
                content: t.String(),
            }),
        },
        handler: async (req) => {
            await db
                .update(promptTemplate)
                .set({name: req.body.name, content: req.body.content})
                .where(eq(promptTemplate.id, Number(req.params.id)))
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
                id: t.String(),
            }),
        },
        handler: async (req) => {
            await db.delete(promptTemplate).where(eq(promptTemplate.id, Number(req.params.id)))
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
                id: t.String(),
            }),
        },
        handler: async (req) => {
            await db
                .update(user)
                .set({promptTemplate: Number(req.params.id)})
                .where(eq(user.id, 1))
        },
    })
}
