import {eq} from 'drizzle-orm'
import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import {Template} from '@huggingface/jinja'
import {t} from '../trpc.js'
import {db, PromptTemplate, User, insertPromptTemplateSchema} from '../db/index.js'
import {logger} from '../logging.js'

export const templatesRoutes = t.router({
    getAll: t.procedure.query(async () => {
        const templates = await db.query.PromptTemplate.findMany()
        const user = await db.query.User.findFirst({
            with: {promptTemplate: true},
        })
        if (!user || !user.promptTemplate) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Could not get active prompt template',
            })
        }
        return {templates, activeTemplateId: user.promptTemplate.id}
    }),
    create: t.procedure.input(insertPromptTemplateSchema).mutation(async ({input}) => {
        const {name, template} = input
        const [newTemplate] = await db
            .insert(PromptTemplate)
            .values({name, template})
            .returning({id: PromptTemplate.id})
        await db.update(User).set({promptTemplate: newTemplate.id}).where(eq(User.id, 1))
    }),
    update: t.procedure.input(insertPromptTemplateSchema).mutation(async ({input}) => {
        const {id, name, template} = input
        if (!id) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Missing template ID',
            })
        }
        await db.update(PromptTemplate).set({name, template}).where(eq(PromptTemplate.id, id))
    }),
    delete: t.procedure.input(z.number()).mutation(async ({input: templateId}) => {
        if (templateId === 1) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Cannot delete the default template',
            })
        }
        await db.update(User).set({promptTemplate: 1}).where(eq(User.id, 1))
        await db.delete(PromptTemplate).where(eq(PromptTemplate.id, templateId))
    }),
    setActiveId: t.procedure.input(z.number()).mutation(async ({input: templateId}) => {
        await db.update(User).set({promptTemplate: templateId}).where(eq(User.id, 1))
    }),
    parseTemplate: t.procedure
        .input(
            z.object({
                template: z.string(),
                characters: z.array(z.any()),
                lore: z.array(z.any()),
            }),
        )
        .query(async ({input}) => {
            const template = new Template(input.template)

            const example = template.render({
                characters: input.characters,
                lore: input.lore,
            })
            logger.info('Parsed chat instruction:', example)

            return example
        }),
})
