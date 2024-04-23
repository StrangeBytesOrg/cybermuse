import type {ZodTypeProvider} from 'fastify-type-provider-zod'
import type {FastifyPluginAsync} from 'fastify'
import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {db, promptSetting} from '../db.js'

export const promptSettingsRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/get-prompt-presets',
        method: 'GET',
        schema: {
            summary: 'Get settings for prompting',
            response: {
                200: z.array(
                    z.object({
                        id: z.number(),
                        name: z.string(),
                        instruction: z.string(),
                        promptTemplate: z.string(),
                    }),
                ),
            },
        },
        handler: async () => {
            // const settings = await db.query.promptSetting.findFirst()
            return await db.query.promptSetting.findMany()
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/create-prompt-preset',
        method: 'POST',
        schema: {
            summary: 'Create settings for prompting',
            // body: z.object({
            //     name: z.string(),
            //     instruction: z.string(),
            //     promptTemplate: z.string(),
            // }),
            response: {
                200: z.object({
                    id: z.number(),
                    name: z.string(),
                }),
            },
        },
        handler: async () => {
            const newPromptPreset = await db
                .insert(promptSetting)
                .values({
                    name: 'New Prompt Preset',
                    instruction: '',
                    promptTemplate: '',
                })
                .returning({id: promptSetting.id, name: promptSetting.name})
            return {
                id: newPromptPreset[0].id,
                name: newPromptPreset[0].name,
            }
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/set-prompt-preset',
        method: 'POST',
        schema: {
            summary: 'Set settings for prompting',
            body: z.object({
                id: z.number(),
                name: z.string(),
                instruction: z.string(),
                promptTemplate: z.string(),
            }),
            response: {
                200: z.object({success: z.boolean()}),
            },
        },
        handler: async (req) => {
            try {
                await db
                    .update(promptSetting)
                    .set({
                        name: req.body.name,
                        instruction: req.body.instruction,
                        promptTemplate: req.body.promptTemplate,
                    })
                    .where(eq(promptSetting.id, req.body.id))
                return {success: true}
            } catch (err) {
                console.error(err)
                throw new Error('Failed to set settings')
            }
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/set-active-prompt-preset',
        method: 'POST',
        schema: {
            summary: 'Set active prompt preset',
            body: z.object({
                id: z.number(),
            }),
            response: {
                200: z.object({success: z.boolean()}),
            },
        },
        handler: async (req) => {
            await db.update(promptSetting).set({active: null})
            const wat = await db.update(promptSetting).set({active: true}).where(eq(promptSetting.id, req.body.id))
            console.log(wat)
        },
    })
}
