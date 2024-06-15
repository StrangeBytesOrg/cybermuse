import type {ZodTypeProvider} from 'fastify-type-provider-zod'
import type {FastifyPluginAsync} from 'fastify'
import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {db, generatePresets, selectPresetSchema, insertPresetSchema, user} from '../db.js'

export const generatePresetsRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/presets',
        method: 'GET',
        schema: {
            summary: 'Get all generation presets',
            response: {
                200: z.object({
                    presets: z.array(selectPresetSchema),
                    activePresetId: z.number().nullable(),
                }),
            },
        },
        handler: async () => {
            const dbPresets = await db.query.generatePresets.findMany()
            const dbUser = await db.query.user.findFirst({
                with: {generatePreset: true},
            })
            if (!dbPresets) {
                throw new Error('No presets found')
            }
            if (!dbUser || !dbUser.generatePreset) {
                throw new Error('No user found')
            }

            return {presets: dbPresets, activePresetId: dbUser.generatePreset.id}
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/preset/:id',
        method: 'GET',
        schema: {
            summary: 'Get a generation preset',
            params: z.object({
                id: z.string(),
            }),
            response: {
                200: z.object({preset: selectPresetSchema}),
            },
        },
        handler: async (req) => {
            const dbPreset = await db.query.generatePresets.findFirst({
                where: eq(generatePresets.id, Number(req.params.id)),
            })
            if (!dbPreset) {
                throw new Error('Preset not found')
            }
            return {preset: dbPreset}
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/create-preset',
        method: 'POST',
        schema: {
            summary: 'Create a generation preset',
            body: insertPresetSchema,
            response: {
                200: z.object({success: z.boolean()}),
            },
        },
        handler: async (req) => {
            try {
                await db.insert(generatePresets).values({
                    name: req.body.name,
                    context: req.body.context,
                    maxTokens: req.body.maxTokens,
                    temperature: req.body.temperature,
                    seed: req.body.seed,
                    topK: req.body.topK,
                    topP: req.body.topP,
                    minP: req.body.minP,
                    tfsz: req.body.tfsz,
                    typicalP: req.body.typicalP,
                    repeatPenalty: req.body.repeatPenalty,
                    repeatLastN: req.body.repeatLastN,
                    penalizeNL: req.body.penalizeNL,
                    presencePenalty: req.body.presencePenalty,
                    frequencyPenalty: req.body.frequencyPenalty,
                    mirostat: req.body.mirostat,
                    mirostatTau: req.body.mirostatTau,
                    mirostatEta: req.body.mirostatEta,
                })
                return {success: true}
            } catch (err) {
                console.error(err)
                throw new Error('Failed to create generate preset')
            }
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/update-preset/:id',
        method: 'POST',
        schema: {
            summary: 'Update a generation preset',
            params: z.object({
                id: z.string(),
            }),
            body: insertPresetSchema,
            response: {
                200: z.object({success: z.boolean()}),
            },
        },
        handler: async (req) => {
            try {
                await db
                    .update(generatePresets)
                    .set({
                        name: req.body.name,
                        context: req.body.context,
                        maxTokens: req.body.maxTokens,
                        temperature: req.body.temperature,
                        seed: req.body.seed,
                        topK: req.body.topK,
                        topP: req.body.topP,
                        minP: req.body.minP,
                        tfsz: req.body.tfsz,
                        typicalP: req.body.typicalP,
                        repeatPenalty: req.body.repeatPenalty,
                        repeatLastN: req.body.repeatLastN,
                        penalizeNL: req.body.penalizeNL,
                        presencePenalty: req.body.presencePenalty,
                        frequencyPenalty: req.body.frequencyPenalty,
                        mirostat: req.body.mirostat,
                        mirostatTau: req.body.mirostatTau,
                        mirostatEta: req.body.mirostatEta,
                    })
                    .where(eq(generatePresets.id, Number(req.params.id)))
                return {success: true}
            } catch (err) {
                console.error(err)
                throw new Error('Failed to update generate preset')
            }
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/delete-preset/:id',
        method: 'POST',
        schema: {
            summary: 'Delete a generation preset',
            params: z.object({
                id: z.string(),
            }),
        },
        handler: async (req) => {
            try {
                await db.delete(generatePresets).where(eq(generatePresets.id, Number(req.params.id)))
            } catch (err) {
                if (err instanceof Error && err.message === 'FOREIGN KEY constraint failed') {
                    throw new Error('Cannot delete set preset')
                }
            }
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/set-active-preset/:id',
        method: 'POST',
        schema: {
            summary: 'Set the active generation preset',
            params: z.object({
                id: z.string(),
            }),
        },
        handler: async (req) => {
            await db
                .update(user)
                .set({generatePreset: Number(req.params.id)})
                .where(eq(user.id, 1))
        },
    })
}
