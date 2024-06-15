import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import {serializerCompiler, validatorCompiler, jsonSchemaTransform} from 'fastify-type-provider-zod'
import {getConfig} from './config.js'

// Routes
import {characterRoutes} from './controllers/character.js'
import {chatRoutes} from './controllers/chats.js'
import {messageRoutes} from './controllers/message.js'
import {templateRoutes} from './controllers/templates.js'
import {generatePresetsRoutes} from './controllers/generate-presets.js'
import {modelRoutes} from './controllers/models.js'
// import {generateRoutes} from './controllers/generate.js'
import {llamaServerRoutes} from './controllers/llama-server.js'

// Fixture DB data
import {fixtureData} from './fixture.js'
await fixtureData()

// const outLogFile = fs.createWriteStream('./out.log', {flags: 'a'})
// const errLogFile = fs.createWriteStream('./err.log', {flags: 'a'})
// process.stdout.write = outLogFile.write.bind(outLogFile)
// process.stderr.write = errLogFile.write.bind(errLogFile)

const config = getConfig()

// if (config.autoLoad) {
//     await loadModel(config.lastModel)
// }

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
        servers: [{url: '/api'}],
    },
})

await server.register(fastifySwaggerUI, {
    routePrefix: '/docs',
})

// Register controller routes
await server.register(characterRoutes, {prefix: '/api'})
await server.register(chatRoutes, {prefix: '/api'})
await server.register(messageRoutes, {prefix: '/api'})
await server.register(modelRoutes, {prefix: '/api'})
await server.register(generatePresetsRoutes, {prefix: '/api'})
// await server.register(generateRoutes, {prefix: '/api'})
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
