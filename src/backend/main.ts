import path from 'node:path'
import url from 'node:url'
import {app, BrowserWindow} from 'electron'
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
import {getStatus, generate, loadModel, listModels, setModelDir} from './generate.js'
import sourcemapSupport from 'source-map-support'

const serverPort = 31700
const esmDirname = url.fileURLToPath(new URL('.', import.meta.url)) // Works like __dirname
sourcemapSupport.install()

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 800,
        webPreferences: {},
    })

    win.setMenu(null)

    if (app.isPackaged) {
        win.loadFile(path.resolve(esmDirname, '../index.html'))
    } else {
        win.webContents.openDevTools({
            mode: 'bottom', // 'undocked'
        })
        win.loadURL('http://localhost:5173')
    }
}

app.on('ready', createWindow)

const server = Fastify({
    // logger: true,
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    },
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

server.withTypeProvider<ZodTypeProvider>().get('/status', {
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
        const status = getStatus()
        return status
    },
})

server.withTypeProvider<ZodTypeProvider>().get('/models', {
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
        const models = await listModels()
        return models
    },
})

server.withTypeProvider<ZodTypeProvider>().post('/load-model', {
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

server.withTypeProvider<ZodTypeProvider>().post('/set-model-dir', {
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

server.withTypeProvider<ZodTypeProvider>().post('/generate', {
    schema: {
        summary: 'Generate a completion',
        body: z.object({
            prompt: z.string(),
        }),
        response: {
            200: z.string(),
        },
    },
    handler: async (req) => {
        const prompt = req.body.prompt
        if (prompt) {
            const wat = await generate(prompt)
            return wat
        }
    },
})

const delay = () => new Promise((resolve) => setTimeout(resolve, 1000))
server.withTypeProvider<ZodTypeProvider>().get('/generate-stream', {
    schema: {
        summary: 'Generate a completion stream',
        description: 'This endpoint uses Server-Sent Events (SSE) to stream data to the client.',
        produces: ['text/event-stream'],
        response: {
            200: z.string().describe('data: {payload}'),
        },
    },
    handler: async (req, reply) => {
        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        })
        reply.raw.write(`data: Yo\n`)
        await delay()
        reply.raw.write(`data: Yo 2\n`)
        reply.raw.end()
    },
})

server.listen({port: serverPort}, (error) => {
    if (error) {
        console.error(error)
    }
    console.log(`Server running on port ${serverPort}`)
})
