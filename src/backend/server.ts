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
import {getStatus, generate, loadModel, listModels, setModelDir, setAutoLoad, detokenize} from './generate.js'

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
    openapi: {
        openapi: '3.0.0',
        info: {
            title: 'Chat App builtin server API',
            version: '0.1.0',
        },
    },
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
    url: '/api/load-model',
    method: 'POST',
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
    url: '/api/set-model-dir',
    method: 'POST',
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
    url: '/api/set-auto-load',
    method: 'POST',
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
    url: '/api/generate-stream',
    method: 'POST',
    schema: {
        summary: 'Generate a completion stream',
        description:
            'Generates text and returns it using Server-Sent Events (SSE) to stream the response.\n```\nevent: message | final\ndata: {text}\n```\n\nThe `message` event is sent for each token generated and the `final` event is sent at the end with the full response.\n\nThis is a non standard SSE implementation in order to support sending a body and using POST requests so it will not work with the browser EventSource API.',
        body: z.object({
            prompt: z.string(),
            maxTokens: z.number().optional(),
            temperature: z.number().optional(),
            minP: z.number().optional(),
            topP: z.number().optional(),
            topK: z.number().optional(),
            // repeatPenalty: // TODO More complex than simple number input. Needs further investigation.
            // stop: z.array(z.string()).optional(),
            // seed: z.number().optional(),
        }),
        produces: ['text/event-stream'],
        response: {
            200: z.string().describe('data: {text}'),
        },
    },
    handler: async (req, reply) => {
        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-store',
            Connection: 'keep-alive',
            'access-control-allow-origin': '*',
        })

        const prompt = req.body.prompt
        const fullResponse = await generate(prompt, {
            maxTokens: req.body.maxTokens,
            temperature: req.body.temperature,
            minP: req.body.minP,
            topP: req.body.topP,
            topK: req.body.topK,
            // repeatPenalty: req.body.repeatPenalty,
            onToken: (token) => {
                const text = detokenize(token)
                reply.raw.write('event: message\n')
                reply.raw.write(`data: ${JSON.stringify({text})}\n\n`)
            },
        })
        // Send the full response at the end as an extra check
        const finalResponse = `event: final\ndata: ${JSON.stringify({text: fullResponse})}\n\n`
        reply.raw.end(finalResponse)
    },
})
