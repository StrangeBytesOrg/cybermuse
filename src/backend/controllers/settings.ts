import type {ZodTypeProvider} from 'fastify-type-provider-zod'
import type {FastifyPluginAsync} from 'fastify'
import {z} from 'zod'
import {getStatus} from '../generate.js'

export const settingsRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/status',
        method: 'GET',
        schema: {
            summary: 'Get status info about the server',
            response: {
                200: z.object({
                    modelLoaded: z.boolean(),
                    currentModel: z.string().optional(),
                    modelDir: z.string().optional(),
                    autoLoad: z.boolean(),
                }),
            },
        },
        handler: async () => {
            return getStatus()
        },
    })
}
