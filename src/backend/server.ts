import path from 'node:path'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import {fastifyTRPCPlugin, FastifyTRPCPluginOptions} from '@trpc/server/adapters/fastify'
import fastifyStatic from '@fastify/static'
import {avatarsPath} from './paths.js'
import {logger} from './logging.js'
import {getConfig} from './config.js'
import {loadModel} from './llama-cpp.js'
import {appRouter, type AppRouter} from './router.js'
import {createContext} from './trpc.js'
import {ZodError} from 'zod'
import {fromError} from 'zod-validation-error'

const config = getConfig()

export const server = Fastify({
    bodyLimit: 1024 * 1024 * 100, // 100MB
})
server.register(cors)

// TODO send trpc error for too large of file
// server.setErrorHandler((error, request, reply) => {
//     logger.error(error)
// })

// Register API endpoints
await server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
        router: appRouter,
        createContext,
        onError({error}) {
            if (error.cause instanceof ZodError) {
                const formattedError = fromError(error.cause, {issueSeparator: '\n', prefix: '', prefixSeparator: ''})
                error.message = formattedError.message
            }
        },
    } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
})

// Serve frontend. Use a fallback to index.html for SPA routing
await server.register(fastifyStatic, {
    root: path.resolve(import.meta.dirname, '../', 'frontend'),
    prefix: '/',
})
server.setNotFoundHandler((request, reply) => reply.sendFile('/index.html'))

// Serve avatars
await server.register(fastifyStatic, {
    root: avatarsPath,
    prefix: '/avatars/',
    list: true,
    index: false,
    decorateReply: false,
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
