import path from 'node:path'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import {fastifyTRPCPlugin, FastifyTRPCPluginOptions} from '@trpc/server/adapters/fastify'
import fastifyStatic from '@fastify/static'
// import fastifySwagger from '@fastify/swagger'
// import fastifySwaggerUI from '@fastify/swagger-ui'
import {TypeBoxValidatorCompiler} from '@fastify/type-provider-typebox'
import {avatarsPath} from './paths.js'
import {logger} from './logging.js'
import {getConfig} from './config.js'
import {loadModel} from './llama-cpp.js'
import {appRouter, type AppRouter} from './router.js'
import {createContext} from './trpc.js'

// Routes
// import {characterRoutes} from './controllers/character.js'
import {chatRoutes} from './controllers/chats.js'
import {loreRoutes} from './controllers/lore.js'
import {messageRoutes} from './controllers/message.js'
import {swipeRoutes} from './controllers/swipes.js'
// import {templateRoutes} from './controllers/templates.js'
import {generatePresetsRoutes} from './controllers/generate-presets.js'
import {modelRoutes} from './controllers/models.js'
import {llamaCppRoutes} from './controllers/llama-cpp.js'

// Fixture DB data
import {fixtureData} from './fixture.js'
await fixtureData()

const config = getConfig()

export const server = Fastify({
    bodyLimit: 1024 * 1024 * 100, // 100MB
})
server.register(cors)
server.setValidatorCompiler(TypeBoxValidatorCompiler)
// server.setErrorHandler((error, request, reply) => {
//     console.error(error)
//     // logger.error(error)
//     reply.status(500).send(error)
// })
server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
        router: appRouter,
        createContext,
    } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
})

// await server.register(fastifySwagger, {
//     openapi: {
//         openapi: '3.1.0',
//         info: {
//             title: 'Chat App builtin server API',
//             version: '0.1.0',
//         },
//         servers: [{url: '/api'}],
//     },
//     refResolver: {
//         buildLocalReference(json, baseUrl, fragment, i) {
//             return String(json.$id) || `def-${i}`
//         },
//     },
// })

// await server.register(fastifySwaggerUI, {
//     routePrefix: '/docs',
// })

// Serve avatars
await server.register(async (instance) => {
    await instance.register(fastifyStatic, {
        root: avatarsPath,
        prefix: '/avatars/',
    })
})

// Register controller routes
// await server.register(characterRoutes, {prefix: '/api'})
await server.register(chatRoutes, {prefix: '/api'})
await server.register(loreRoutes, {prefix: '/api'})
await server.register(messageRoutes, {prefix: '/api'})
await server.register(swipeRoutes, {prefix: '/api'})
await server.register(modelRoutes, {prefix: '/api'})
await server.register(generatePresetsRoutes, {prefix: '/api'})
// await server.register(templateRoutes, {prefix: '/api'})
await server.register(llamaCppRoutes, {prefix: '/api'})

// Serve frontend
await server.register(fastifyStatic, {
    root: path.resolve(import.meta.dirname, '../'),
})

server.listen({port: config.serverPort, host: '0.0.0.0'}, (error) => {
    if (error) {
        logger.error(error)
    }
    logger.info(`Server running on port ${config.serverPort}`)
})

if (config.autoLoad) {
    logger.info('auto loading')
    await loadModel(
        config.modelsPath,
        config.lastModel,
        config.contextSize,
        config.batchSize,
        config.gpuLayers,
        config.useFlashAttn,
    )
}

// SIGINT is fired on ctrl+c
process.on('SIGINT', () => {
    server.close()
})
// TSX sends a SIGTERM when using watch mode
process.on('SIGTERM', () => {
    server.close()
})
