import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {t} from '../trpc.js'
import {db, GeneratePreset, insertPresetSchema, User} from '../db.js'
import {TRPCError} from '@trpc/server'

export const generatePresetsRouter = t.router({
    getAll: t.procedure.query(async () => {
        const presets = await db.query.GeneratePreset.findMany()
        const user = await db.query.User.findFirst({
            with: {generatePreset: true},
        })
        if (!presets) {
            throw new Error('No presets found')
        }
        if (!user || !user.generatePreset) {
            throw new Error('No user found')
        }

        return {presets, activePresetId: user.generatePreset.id}
    }),
    create: t.procedure.input(insertPresetSchema).mutation(async ({input}) => {
        try {
            const {lastInsertRowid} = await db.insert(GeneratePreset).values({
                name: input.name,
                context: input.context,
                maxTokens: input.maxTokens,
                temperature: input.temperature,
                seed: input.seed,
                topK: input.topK,
                topP: input.topP,
                minP: input.minP,
                repeatPenalty: input.repeatPenalty,
                repeatLastN: input.repeatLastN,
                penalizeNL: input.penalizeNL,
                presencePenalty: input.presencePenalty,
                frequencyPenalty: input.frequencyPenalty,
            })
            await db
                .update(User)
                .set({generatePreset: Number(lastInsertRowid)})
                .where(eq(User.id, 1))
        } catch (err) {
            console.error(err)
            // TODO use proper error handling and response
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to create generate preset',
            })
        }
    }),
    update: t.procedure.input(insertPresetSchema).mutation(async ({input}) => {
        if (!input.id) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Missing preset ID',
            })
        }
        try {
            await db
                .update(GeneratePreset)
                .set({
                    name: input.name,
                    context: input.context,
                    maxTokens: input.maxTokens,
                    temperature: input.temperature,
                    seed: input.seed,
                    topK: input.topK,
                    topP: input.topP,
                    minP: input.minP,
                    repeatPenalty: input.repeatPenalty,
                    repeatLastN: input.repeatLastN,
                    penalizeNL: input.penalizeNL,
                    presencePenalty: input.presencePenalty,
                    frequencyPenalty: input.frequencyPenalty,
                })
                .where(eq(GeneratePreset.id, input.id))
        } catch (err) {
            console.error(err)
            // TODO use proper error handling and response
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to update generate preset',
            })
        }
    }),
    delete: t.procedure.input(z.number()).mutation(async ({input}) => {
        if (input === 1) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Cannot delete the default preset',
            })
        }
        await db.update(User).set({generatePreset: 1}).where(eq(User.id, 1))
        await db.delete(GeneratePreset).where(eq(GeneratePreset.id, input))
    }),
    setActive: t.procedure.input(z.number()).mutation(async ({input: id}) => {
        await db.update(User).set({generatePreset: id}).where(eq(User.id, 1))
    }),
})
