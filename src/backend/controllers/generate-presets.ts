import {Elysia, t} from 'elysia'
import {eq} from 'drizzle-orm'
import {db, generatePresets, selectPresetSchema, insertPresetSchema, user} from '../db.js'

export const generatePresetsRoutes = new Elysia()
generatePresetsRoutes.get(
    '/presets',
    async () => {
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
    {
        tags: ['generate-presets'],
        detail: {
            operationId: 'GetAllGenerationPresets',
            summary: 'Get all generation presets',
        },
        response: {
            200: t.Object({
                presets: t.Array(selectPresetSchema),
                activePresetId: t.Number(),
            }),
        },
    },
)

generatePresetsRoutes.get(
    '/preset/:id',
    async ({params}) => {
        const dbPreset = await db.query.generatePresets.findFirst({
            where: eq(generatePresets.id, Number(params.id)),
        })
        if (!dbPreset) {
            throw new Error('Preset not found')
        }
        return {preset: dbPreset}
    },
    {
        tags: ['generate-presets'],
        detail: {
            operationId: 'GetGenerationPresetById',
            summary: 'Get a generation preset',
        },
        params: t.Object({
            id: t.String(),
        }),
        response: {
            200: t.Object({preset: selectPresetSchema}),
        },
    },
)

generatePresetsRoutes.post(
    '/create-preset',
    async ({body}) => {
        try {
            await db.insert(generatePresets).values({
                name: body.name,
                context: body.context,
                maxTokens: body.maxTokens,
                temperature: body.temperature,
                seed: body.seed,
                topK: body.topK,
                topP: body.topP,
                minP: body.minP,
                tfsz: body.tfsz,
                typicalP: body.typicalP,
                repeatPenalty: body.repeatPenalty,
                repeatLastN: body.repeatLastN,
                penalizeNL: body.penalizeNL,
                presencePenalty: body.presencePenalty,
                frequencyPenalty: body.frequencyPenalty,
                mirostat: body.mirostat,
                mirostatTau: body.mirostatTau,
                mirostatEta: body.mirostatEta,
            })
        } catch (err) {
            console.error(err)
            throw new Error('Failed to create generate preset')
        }
    },
    {
        tags: ['generate-presets'],
        detail: {
            operationId: 'CreateGenerationPreset',
            summary: 'Create a generation preset',
        },
        body: insertPresetSchema,
    },
)

generatePresetsRoutes.post(
    '/update-preset/:id',
    async ({params, body}) => {
        try {
            await db
                .update(generatePresets)
                .set({
                    name: body.name,
                    context: body.context,
                    maxTokens: body.maxTokens,
                    temperature: body.temperature,
                    seed: body.seed,
                    topK: body.topK,
                    topP: body.topP,
                    minP: body.minP,
                    tfsz: body.tfsz,
                    typicalP: body.typicalP,
                    repeatPenalty: body.repeatPenalty,
                    repeatLastN: body.repeatLastN,
                    penalizeNL: body.penalizeNL,
                    presencePenalty: body.presencePenalty,
                    frequencyPenalty: body.frequencyPenalty,
                    mirostat: body.mirostat,
                    mirostatTau: body.mirostatTau,
                    mirostatEta: body.mirostatEta,
                })
                .where(eq(generatePresets.id, Number(params.id)))
        } catch (err) {
            console.error(err)
            throw new Error('Failed to update generate preset')
        }
    },
    {
        tags: ['generate-presets'],
        detail: {
            operationId: 'UpdateGenerationPreset',
            summary: 'Update a generation preset',
        },
        params: t.Object({
            id: t.String(),
        }),
        body: insertPresetSchema,
    },
)

generatePresetsRoutes.post(
    '/delete-preset/:id',
    async ({params}) => {
        try {
            await db.delete(generatePresets).where(eq(generatePresets.id, Number(params.id)))
        } catch (err) {
            if (err instanceof Error && err.message === 'FOREIGN KEY constraint failed') {
                throw new Error('Cannot delete set preset')
            }
        }
    },
    {
        tags: ['generate-presets'],
        detail: {
            operationId: 'DeleteGenerationPreset',
            summary: 'Delete a generation preset',
        },
        params: t.Object({
            id: t.String(),
        }),
    },
)

generatePresetsRoutes.post(
    '/set-active-preset/:id',
    async ({params}) => {
        await db
            .update(user)
            .set({generatePreset: Number(params.id)})
            .where(eq(user.id, 1))
    },
    {
        tags: ['generate-presets'],
        detail: {
            operationId: 'SetActiveGenerationPreset',
            summary: 'Set the active generation preset',
        },
        params: t.Object({
            id: t.String(),
        }),
    },
)
