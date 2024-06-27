import {Elysia, t} from 'elysia'
import {eq} from 'drizzle-orm'
import {db, user, promptTemplate, selectPromptTemplateSchema} from '../db.js'

export const templateRoutes = new Elysia()
templateRoutes.get(
    '/templates',
    async () => {
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
    {
        tags: ['templates'],
        detail: {
            operationId: 'GetAllPromptTemplates',
            summary: 'Get all prompt templates',
        },
        response: {
            200: t.Object({
                templates: t.Array(selectPromptTemplateSchema),
                activeTemplateId: t.Number(),
            }),
        },
    },
)

templateRoutes.get(
    '/template/:id',
    async ({params}) => {
        const dbTemplate = await db.query.promptTemplate.findFirst({
            where: eq(promptTemplate.id, Number(params.id)),
        })
        if (!dbTemplate) {
            throw new Error('Template not found')
        }
        return {template: dbTemplate}
    },
    {
        tags: ['templates'],
        detail: {
            operationId: 'GetPromptTemplateById',
            summary: 'Get a prompt template',
        },
        params: t.Object({
            id: t.String(),
        }),
        response: {
            200: t.Object({template: selectPromptTemplateSchema}),
        },
    },
)

templateRoutes.post(
    '/create-template',
    async ({body}) => {
        const [newTemplate] = await db
            .insert(promptTemplate)
            .values({name: body.name, content: body.content})
            .returning({id: promptTemplate.id})
        // TODO throw an error if a template wasn't created
        return {id: newTemplate.id}
    },
    {
        tags: ['templates'],
        detail: {
            operationId: 'CreatePromptTemplate',
            summary: 'Create a prompt template',
        },
        body: t.Object({
            name: t.String(),
            content: t.String(),
        }),
        response: {
            200: t.Object({id: t.Number()}),
        },
    },
)

templateRoutes.post(
    '/update-template/:id',
    async ({params, body}) => {
        await db
            .update(promptTemplate)
            .set({name: body.name, content: body.content})
            .where(eq(promptTemplate.id, Number(params.id)))
    },
    {
        tags: ['templates'],
        detail: {
            operationId: 'UpdatePromptTemplate',
            summary: 'Update a prompt template',
        },
        params: t.Object({
            id: t.String(),
        }),
        body: t.Object({
            name: t.String(),
            content: t.String(),
        }),
    },
)

templateRoutes.post(
    '/delete-template/:id',
    async ({params}) => {
        await db.delete(promptTemplate).where(eq(promptTemplate.id, Number(params.id)))
    },
    {
        tags: ['templates'],
        detail: {
            operationId: 'DeletePromptTemplate',
            summary: 'Delete a prompt template',
        },
        params: t.Object({
            id: t.String(),
        }),
    },
)

templateRoutes.post(
    '/set-active-template/:id',
    async ({params}) => {
        await db
            .update(user)
            .set({promptTemplate: Number(params.id)})
            .where(eq(user.id, 1))
    },
    {
        tags: ['templates'],
        detail: {
            operationId: 'SetActivePromptTemplate',
            summary: 'Set active prompt template',
        },
        params: t.Object({
            id: t.String(),
        }),
    },
)
