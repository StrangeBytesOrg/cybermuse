import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox'
import type {FastifyPluginAsync} from 'fastify'
import {Type as t} from '@sinclair/typebox'
import {eq} from 'drizzle-orm'
import {db, generatePresets, selectPresetSchema, insertPresetSchema, user} from '../db.js'

export const generatePresetsRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/presets',
        method: 'GET',
        schema: {
            operationId: 'GetAllGenerationPresets',
            tags: ['generate-presets'],
            summary: 'Get all generation presets',
            response: {
                200: t.Object({
                    presets: t.Array(selectPresetSchema),
                    activePresetId: t.Number(),
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

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/preset/:id',
        method: 'GET',
        schema: {
            operationId: 'GetGenerationPresetById',
            tags: ['generate-presets'],
            summary: 'Get a generation preset',
            params: t.Object({
                id: t.String(),
            }),
            response: {
                200: t.Object({preset: selectPresetSchema}),
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

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/create-preset',
        method: 'POST',
        schema: {
            operationId: 'CreateGenerationPreset',
            tags: ['generate-presets'],
            summary: 'Create a generation preset',
            body: insertPresetSchema,
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
            } catch (err) {
                console.error(err)
                throw new Error('Failed to create generate preset')
            }
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/update-preset/:id',
        method: 'POST',
        schema: {
            operationId: 'UpdateGenerationPreset',
            tags: ['generate-presets'],
            summary: 'Update a generation preset',
            params: t.Object({
                id: t.String(),
            }),
            body: insertPresetSchema,
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
            } catch (err) {
                console.error(err)
                throw new Error('Failed to update generate preset')
            }
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/delete-preset/:id',
        method: 'POST',
        schema: {
            operationId: 'DeleteGenerationPreset',
            tags: ['generate-presets'],
            summary: 'Delete a generation preset',
            params: t.Object({
                id: t.String(),
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

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/set-active-preset/:id',
        method: 'POST',
        schema: {
            operationId: 'SetActiveGenerationPreset',
            tags: ['generate-presets'],
            summary: 'Set the active generation preset',
            params: t.Object({
                id: t.String(),
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
