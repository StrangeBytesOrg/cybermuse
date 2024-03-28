import {getLlama, LlamaCompletion, type LlamaModel, type LlamaContext} from 'node-llama-cpp'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import {
    serializerCompiler,
    validatorCompiler,
    jsonSchemaTransform,
    type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import z from 'zod'
import {getStatus, generate, loadModel, listModels, setModelDir, setAutoLoad} from './generate.js'
import {type GenerateParams} from './generate.js'

export const server = Fastify({
    // logger: true,
    // logger: {
    //     transport: {
    //         target: 'pino-pretty',
    //         options: {
    //             translateTime: 'HH:MM:ss Z',
    //             ignore: 'pid,hostname',
    //         },
    //     },
    // },
})

server.register(cors)
server.setSerializerCompiler(serializerCompiler)
server.setValidatorCompiler(validatorCompiler)

await server.register(fastifySwagger, {
    transform: jsonSchemaTransform,
})
await server.register(fastifySwaggerUI, {
    routePrefix: '/docs',
})

server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/status',
    method: 'GET',
    schema: {
        summary: 'Get status info about the server',
        response: {
            200: z.object({
                modelLoaded: z.boolean(),
                currentModel: z.string().optional(),
                modelDir: z.string().optional(),
            }),
        },
    },
    handler: async () => {
        return getStatus()
    },
})

server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/models',
    method: 'GET',
    schema: {
        summary: 'Get all models',
        response: {
            200: z.array(
                z.object({
                    name: z.string(),
                }),
            ),
        },
    },
    handler: async () => {
        return await listModels()
    },
})

server.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/load-model',
    schema: {
        summary: 'Load a model',
        body: z.object({
            modelName: z.string(),
        }),
        response: {
            200: z.object({
                success: z.boolean(),
            }),
        },
    },
    handler: async (req) => {
        const modelName = req.body.modelName
        if (modelName) {
            await loadModel(modelName)
            return {success: true}
        }
    },
})

server.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/set-model-dir',
    schema: {
        summary: 'Set the model folder',
        body: z.object({
            dir: z.string(),
        }),
        response: {
            200: z.object({
                success: z.boolean(),
            }),
        },
    },
    handler: async (req) => {
        const dir = req.body.dir
        if (dir) {
            await setModelDir(dir)
            return {success: true}
        }
    },
})

server.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/set-auto-load',
    schema: {
        summary: 'Set auto load',
        body: z.object({
            autoLoad: z.boolean(),
        }),
        response: {
            200: z.object({
                success: z.boolean(),
            }),
        },
    },
    handler: async (req) => {
        const autoLoad = req.body.autoLoad
        if (autoLoad !== undefined) {
            await setAutoLoad(autoLoad)
            return {success: true}
        }
    },
})

server.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/generate-stream',
    schema: {
        summary: 'Generate a completion stream',
        description: 'This endpoint uses Server-Sent Events (SSE) to stream data to the client.',
        body: z.object({
            prompt: z.string(),
            n_predict: z.number().optional(),
            temperature: z.number().optional(),
            min_p: z.number().optional(),
            top_p: z.number().optional(),
            top_k: z.number().optional(),
            // stop: z.array(z.string()).optional(),
            // seed: z.number().optional(),
            // stream: z.boolean().optional(),
        }),
        produces: ['text/event-stream'],
        response: {
            200: z.string().describe('data: {payload}'),
        },
    },
    handler: async (req, reply) => {
        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-store',
            Connection: 'keep-alive',
            'access-control-allow-origin': '*',
        })

        const generationParams: GenerateParams = {
            prompt: req.body.prompt,
            maxTokens: req.body.n_predict || 100,
            temperature: req.body.temperature || 0.7,
            minP: req.body.min_p || 0.9,
            topP: req.body.top_p || 0.9,
            topK: req.body.top_k || 40,
        }
        await generate(generationParams, (token) => {
            reply.raw.write(`data: ${JSON.stringify({text: token})}\n\n`)
        })
        reply.raw.end()
    },
})
