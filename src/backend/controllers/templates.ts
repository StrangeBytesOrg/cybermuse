import {eq} from 'drizzle-orm'
import {TRPCError} from '@trpc/server'
import {z} from 'zod'
import {Template} from '@huggingface/jinja'
import {t} from '../trpc.js'
import {db, PromptTemplate, User} from '../db.js'
import {logger} from '../logging.js'

export const templatesRoutes = t.router({
    getAll: t.procedure.query(async () => {
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
    }),
    create: t.procedure
        .input(
            z.object({
                name: z.string(),
                template: z.string(),
            }),
        )
        .mutation(async ({input}) => {
            const [newTemplate] = await db
                .insert(PromptTemplate)
                .values({
                    name: input.name,
                    template: input.template,
                })
                .returning({id: PromptTemplate.id})
            await db.update(User).set({promptTemplate: newTemplate.id}).where(eq(User.id, 1))
        }),
    update: t.procedure
        .input(
            z.object({
                id: z.number(),
                name: z.string(),
                template: z.string(),
            }),
        )
        .mutation(async ({input}) => {
            const {changes} = await db
                .update(PromptTemplate)
                .set({
                    name: input.name,
                    template: input.template,
                })
                .where(eq(PromptTemplate.id, Number(input.id)))
            if (changes === 0) {
                throw new TRPCError({
                    code: 'UNPROCESSABLE_CONTENT',
                    message: 'No changes made',
                })
            }
        }),
    delete: t.procedure
        .input(
            z.object({
                id: z.number(),
            }),
        )
        .mutation(async ({input}) => {
            if (input.id === 1) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Cannot delete the default template',
                })
            }
            await db.update(User).set({promptTemplate: 1}).where(eq(User.id, 1))
            await db.delete(PromptTemplate).where(eq(PromptTemplate.id, Number(input.id)))
        }),
    setActiveId: t.procedure
        .input(
            z.object({
                id: z.number(),
            }),
        )
        .mutation(async ({input}) => {
            const {changes} = await db
                .update(User)
                .set({promptTemplate: Number(input.id)})
                .where(eq(User.id, 1))
            if (changes === 0) {
                // TODO handle other reasons for this to fail
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'User not found',
                })
            }
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
