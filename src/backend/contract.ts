import {initContract} from '@ts-rest/core'
import {z} from 'zod'

const c = initContract()

const successSchema = z.object({
    success: z.boolean(),
})

export const contract = c.router({
    status: {
        summary: 'Get status info about the server',
        method: 'GET',
        path: '/status',
        responses: {
            200: z.object({
                modelLoaded: z.boolean(),
                currentModel: z.string().optional(),
                modelDir: z.string().optional(),
            }),
        },
    },
    getModels: {
        summary: 'Get all models',
        method: 'GET',
        path: '/models',
        responses: {
            200: z.array(
                z.object({
                    name: z.string(),
                }),
            ),
        },
    },
    loadModel: {
        summary: 'Load a model',
        method: 'POST',
        path: '/load-model',
        body: z.object({
            modelName: z.string(),
        }),
        responses: {
            200: successSchema,
        },
    },
    setModelDir: {
        summary: 'Set the model folder',
        method: 'POST',
        path: '/set-model-dir',
        body: z.object({
            dir: z.string(),
        }),
        responses: {
            200: successSchema,
        },
    },
    generate: {
        summary: 'Generate a completion',
        method: 'POST',
        path: '/generate',
        body: z.object({
            prompt: z.string(),
        }),
        responses: {
            200: z.string(),
        },
    },
})
