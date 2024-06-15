import type {ZodTypeProvider} from 'fastify-type-provider-zod'
import type {FastifyPluginAsync} from 'fastify'
import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {db, user, promptTemplate, selectPromptTemplateSchema} from '../db.js'

export const templateRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/templates',
        method: 'GET',
        schema: {
            summary: 'Get all prompt templates',
            response: {
                200: z.object({
                    templates: z.array(selectPromptTemplateSchema),
                    activeTemplateId: z.number(),
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

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/template/:id',
        method: 'GET',
        schema: {
            summary: 'Get a prompt template',
            params: z.object({
                id: z.string(),
            }),
            response: {
                200: z.object({template: selectPromptTemplateSchema}),
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

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/create-template',
        method: 'POST',
        schema: {
            summary: 'Create a prompt template',
            body: z.object({
                name: z.string(),
                content: z.string(),
            }),
        },
        handler: async (req) => {
            const [newTemplate] = await db
                .insert(promptTemplate)
                .values({name: req.body.name, content: req.body.content})
                .returning({id: promptTemplate.id})
            return {id: newTemplate.id}
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/update-template/:id',
        method: 'POST',
        schema: {
            summary: 'Update a prompt template',
            params: z.object({
                id: z.string(),
            }),
            body: z.object({
                name: z.string(),
                content: z.string(),
            }),
        },
        handler: async (req) => {
            await db
                .update(promptTemplate)
                .set({name: req.body.name, content: req.body.content})
                .where(eq(promptTemplate.id, Number(req.params.id)))
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/delete-template/:id',
        method: 'POST',
        schema: {
            summary: 'Delete a prompt template',
            params: z.object({
                id: z.string(),
            }),
        },
        handler: async (req) => {
            await db.delete(promptTemplate).where(eq(promptTemplate.id, Number(req.params.id)))
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/set-active-template/:id',
        method: 'POST',
        schema: {
            summary: 'Set active prompt template',
            params: z.object({
                id: z.string(),
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
