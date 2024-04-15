import type {ZodTypeProvider} from 'fastify-type-provider-zod'
import type {FastifyPluginAsync} from 'fastify'
import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {db, generatePresets} from '../db.js'

export const generatePresetsRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/get-generate-presets',
        method: 'GET',
        schema: {
            summary: 'Get settings for generating text',
            response: {
                200: z.array(
                    z.object({
                        id: z.number(),
                        name: z.string(),
                        temperature: z.number(),
                        maxTokens: z.number(),
                        minP: z.number().nullable(),
                        topP: z.number().nullable(),
                        topK: z.number().nullable(),
                    }),
                ),
            },
        },
        handler: async () => {
            return await db.query.generatePresets.findMany()
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/create-generate-preset',
        method: 'POST',
        schema: {
            summary: 'Set settings for generating text',
            body: z.object({
                name: z.string(),
                temperature: z.number(),
                maxTokens: z.number(),
                minP: z.number().nullable(),
                topP: z.number().nullable(),
                topK: z.number().nullable(),
            }),
            response: {
                200: z.object({success: z.boolean()}),
            },
        },
        handler: async (req) => {
            try {
                const {name, maxTokens, temperature, minP, topK, topP} = req.body
                await db.insert(generatePresets).values({name, maxTokens, temperature, minP, topK, topP})
                return {success: true}
            } catch (err) {
                console.error(err)
                throw new Error('Failed to set generate preset')
            }
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/update-generate-preset',
        method: 'POST',
        schema: {
            summary: 'Update settings for generating text',
            body: z.object({
                id: z.number(),
                name: z.string(),
                temperature: z.number(),
                maxTokens: z.number(),
                minP: z.number().nullable(),
                topP: z.number().nullable(),
                topK: z.number().nullable(),
            }),
            response: {
                200: z.object({success: z.boolean()}),
            },
        },
        handler: async (req) => {
            try {
                const {id, name, maxTokens, temperature, minP, topK, topP} = req.body
                await db
                    .update(generatePresets)
                    .set({name, maxTokens, temperature, minP, topK, topP})
                    .where(eq(generatePresets.id, id))
                return {success: true}
            } catch (err) {
                console.error(err)
                throw new Error('Failed to update generate preset')
            }
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/delete-generate-preset',
        method: 'POST',
        schema: {
            summary: 'Delete settings for generating text',
            body: z.object({
                id: z.number(),
            }),
            response: {
                200: z.object({success: z.boolean()}),
            },
        },
        handler: async (req) => {
            if (req.body.id === 1) {
                throw new Error('Cannot delete default preset')
            }
            try {
                await db.delete(generatePresets).where(eq(generatePresets.id, req.body.id))
                return {success: true}
            } catch (err) {
                console.error(err)
                throw new Error('Failed to delete generate preset')
            }
        },
    })
}
