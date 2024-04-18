import type {ZodTypeProvider} from 'fastify-type-provider-zod'
import type {FastifyPluginAsync} from 'fastify'
import {z} from 'zod'
import {db, promptSetting} from '../db.js'

export const settingsRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/get-settings',
        method: 'GET',
        schema: {
            summary: 'Get settings for prompting',
            response: {
                200: z.object({
                    instruction: z.string(),
                    promptTemplate: z.string(),
                }),
            },
        },
        handler: async () => {
            const settings = await db.query.promptSetting.findFirst()
            return settings
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/set-settings',
        method: 'POST',
        schema: {
            summary: 'Set settings for prompting',
            body: z.object({
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
                    .insert(promptSetting)
                    .values({
                        id: 1,
                        instruction: req.body.instruction,
                        promptTemplate: req.body.promptTemplate,
                    })
                    .onConflictDoUpdate({
                        target: promptSetting.id,
                        set: {
                            instruction: req.body.instruction,
                            promptTemplate: req.body.promptTemplate,
                        },
                    })
                return {success: true}
            } catch (err) {
                console.error(err)
                throw new Error('Failed to set settings')
            }
        },
    })
}
