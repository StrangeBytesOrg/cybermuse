import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import {serializerCompiler, validatorCompiler, jsonSchemaTransform} from 'fastify-type-provider-zod'

// Routes
import {characterRoutes} from './controllers/character.js'
import {chatRoutes} from './controllers/chats.js'
import {messageRoutes} from './controllers/message.js'
import {promptSettingsRoutes} from './controllers/prompt-settings.js'
import {generatePresetsRoutes} from './controllers/generate-presets.js'
import {modelRoutes} from './controllers/models.js'
import {generateRoutes} from './controllers/generate.js'
import {settingsRoutes} from './controllers/settings.js'
import {initDb} from './init.js'

await initDb()

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
    },
})

await server.register(fastifySwaggerUI, {
    routePrefix: '/docs',
})

await server.register(characterRoutes, {prefix: '/api'})
await server.register(chatRoutes, {prefix: '/api'})
await server.register(messageRoutes, {prefix: '/api'})
await server.register(generatePresetsRoutes, {prefix: '/api'})
await server.register(modelRoutes, {prefix: '/api'})
await server.register(generateRoutes, {prefix: '/api'})
await server.register(settingsRoutes, {prefix: '/api'})
await server.register(promptSettingsRoutes, {prefix: '/api'})
