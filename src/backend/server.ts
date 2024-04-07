import fs from 'node:fs'
import path from 'node:path'
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
import {fileExists} from '@huggingface/hub'
import {app} from 'electron'
import {config, getStatus, generate, loadModel, setAutoLoad, detokenize, generateJson} from './generate.js'

const configPath = path.resolve(app.getPath('userData'), 'config.json')

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
                autoLoad: z.boolean(),
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
        try {
            const models = fs.readdirSync(config.modelDir, {withFileTypes: true, recursive: true})
            const modelList = []
            for (let i = 0; i < models.length; i++) {
                const model = models[i]
                if (model.isFile() && model.name.endsWith('.gguf')) {
                    modelList.push({name: model.name})
                }
            }
            return modelList
        } catch (err) {
            console.error(err)
            return []
        }
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
    url: '/api/download-model',
    method: 'POST',
    schema: {
        summary: 'Download a model',
        body: z.object({
            repoId: z.string(),
            path: z.string(),
        }),
        response: {
            200: z.object({
                success: z.boolean(),
            }),
        },
    },
    handler: async (req) => {
        const exists = await fileExists({repo: req.body.repoId, path: req.body.path})
        if (!exists) {
            return {success: false}
        }

        const response = await fetch(`https://huggingface.co/${req.body.repoId}/resolve/main/${req.body.path}`)
        const reader = response.body.getReader()
        const contentLength = Number(response.headers.get('content-length'))
        console.log(`Downloading ${req.body.path}, Size: ${(contentLength / 1024 / 1024).toFixed(2)} MB`)

        const finalPath = path.resolve(config.modelDir, req.body.path)
        console.log(`Model will be downloaded to: ${finalPath}`)
        const fileStream = fs.createWriteStream(finalPath)

        let receivedLength = 0
        while (true) {
            const {done, value} = await reader.read()
            if (done) break
            fileStream.write(value)
            receivedLength += value.length
            const progress = receivedLength / contentLength
            console.log(`Progress: ${(progress * 100).toFixed(2)}%`)
        }
        fileStream.end()
        return {success: true}
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
            400: z.object({
                message: z.string(),
            }),
        },
    },
    handler: async (req, reply) => {
        const dir = req.body.dir
        console.log(`Setting Model Folder: ${dir}`)
        // Check if the directory exists
        if (!fs.existsSync(dir)) {
            console.log('Directory does not exist')
            return reply.status(400).send({message: 'Directory does not exist'})
        }
        config.modelDir = dir
        fs.writeFileSync(configPath, JSON.stringify(config))
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
        const controller = new AbortController()

        req.socket.on('close', () => {
            console.log('socket closed, aborting')
            controller.abort()
        })

        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-store',
            Connection: 'keep-alive',
            'access-control-allow-origin': '*',
        })

        const prompt = req.body.prompt

        try {
            const fullResponse = await generate(prompt, {
                maxTokens: req.body.maxTokens,
                temperature: req.body.temperature,
                minP: req.body.minP,
                topP: req.body.topP,
                topK: req.body.topK,
                signal: controller.signal,
                // repeatPenalty: req.body.repeatPenalty,
                onToken: (token) => {
                    const text = detokenize(token)
                    reply.raw.write(`event: message\ndata: ${JSON.stringify({text})}\n\n`)
                },
            })

            // Send the full response at the end as an extra check
            const finalResponse = `event: final\ndata: ${JSON.stringify({text: fullResponse})}\n\n`
            reply.raw.end(finalResponse)
            req.socket.removeAllListeners('close')
            req.socket.destroy()
        } catch (err) {
            switch (err.name) {
                case 'AbortError':
                    reply.raw.end('event: final\ndata: {text: "Aborted"}\n\n')
                    break
                default:
                    console.log('Unknown error:', err)
                    reply.raw.end('event: final\ndata: {text: "Error"}\n\n')
                    break
            }
        }
    },
})

server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/generate-json',
    method: 'POST',
    schema: {
        summary: 'Generate a completion using a JSON schema',
        body: z.object({
            prompt: z.string(),
            maxTokens: z.number().optional(),
            temperature: z.number().optional(),
            minP: z.number().optional(),
            topP: z.number().optional(),
            topK: z.number().optional(),
            schema: z.any(),
        }),
        response: {
            200: z.string(),
        },
    },
    handler: async (req) => {
        const startTime = performance.now()
        const res = await generateJson(
            req.body.prompt,
            {
                temperature: req.body.temperature,
                maxTokens: req.body.maxTokens,
            },
            // {
            //     type: 'object',
            //     properties: {
            //         respondent: {type: 'string'},
            //     },
            // },
            // {enum: ['Robert Tableson', 'Julia', 'Test Person']},
            req.body.schema,
        )
        const timeTaken = performance.now() - startTime
        console.log(`Response: ${res}`)
        console.log(`Time taken: ${timeTaken}ms`)
        return res
    },
})
