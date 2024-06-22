import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import {TypeBoxValidatorCompiler} from '@fastify/type-provider-typebox'
import {getConfig} from './config.js'

// Routes
import {characterRoutes} from './controllers/character.js'
import {chatRoutes} from './controllers/chats.js'
import {messageRoutes} from './controllers/message.js'
import {templateRoutes} from './controllers/templates.js'
import {generatePresetsRoutes} from './controllers/generate-presets.js'
import {modelRoutes} from './controllers/models.js'
import {generateRoutes} from './controllers/generate.js'
import {llamaServerRoutes, startLlamaServer} from './controllers/llama-server.js'

// Fixture DB data
import {fixtureData} from './fixture.js'
await fixtureData()

// const outLogFile = fs.createWriteStream('./out.log', {flags: 'a'})
// const errLogFile = fs.createWriteStream('./err.log', {flags: 'a'})
// process.stdout.write = outLogFile.write.bind(outLogFile)
// process.stderr.write = errLogFile.write.bind(errLogFile)

const config = getConfig()

if (config.autoLoad) {
    const modelName = config.lastModel
    const contextSize = config.contextSize
    const useGPU = config.useGPU
    await startLlamaServer(modelName, contextSize, useGPU)
}

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
    bodyLimit: 1024 * 1024 * 5, // 5MB
})
server.register(cors)
server.setValidatorCompiler(TypeBoxValidatorCompiler)

await server.register(fastifySwagger, {
    openapi: {
        openapi: '3.1.0',
        info: {
            title: 'Chat App builtin server API',
            version: '0.1.0',
        },
        servers: [{url: '/api'}],
    },
    refResolver: {
        buildLocalReference(json, baseUrl, fragment, i) {
            return String(json.$id) || `def-${i}`
        },
    },
})

await server.register(fastifySwaggerUI, {
    routePrefix: '/docs',
})

// Set media type for error responses
// server.setErrorHandler((error, request, reply) => {
//     reply.headers({'Content-Type': 'application/problem+json'})
//     if (error.validation) {
//         reply.status(400).send({
//             statusCode: 400,
//             error: 'Bad Request',
//             message: error.message,
//         })
//     }
// })

// Create error schema
server.addSchema({
    $id: 'err',
    type: 'object',
    title: 'Default Error',
    properties: {
        statusCode: {type: 'integer'},
        code: {type: 'string'},
        error: {type: 'string'},
        message: {type: 'string'},
    },
})

// Add default error response to all routes
server.addHook('onRoute', (routeOptions) => {
    if (!routeOptions.schema) {
        routeOptions.schema = {}
    }
    if (!routeOptions.schema.response) {
        routeOptions.schema.response = {}
    }
    if (!routeOptions.schema.response.default) {
        routeOptions.schema.response.default = {
            description: 'Default error response',
            content: {'application/problem+json': {schema: {$ref: 'err#'}}},
        }
    }
})

// Register controller routes
await server.register(characterRoutes, {prefix: '/api'})
await server.register(chatRoutes, {prefix: '/api'})
await server.register(messageRoutes, {prefix: '/api'})
await server.register(modelRoutes, {prefix: '/api'})
await server.register(generatePresetsRoutes, {prefix: '/api'})
await server.register(generateRoutes, {prefix: '/api'})
await server.register(templateRoutes, {prefix: '/api'})
await server.register(llamaServerRoutes, {prefix: '/api'})

server.listen({port: config.serverPort}, (error) => {
    if (error) {
        console.error(error)
    }
    console.log(`Server running on port ${config.serverPort}`)
})

process.on('SIGINT', () => {
    server.close()
    process.exit()
})
