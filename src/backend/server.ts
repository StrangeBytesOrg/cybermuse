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
import {eq} from 'drizzle-orm'
import {db, character, generatePresets} from './db.js'
import {getStatus} from './generate.js'

// Routes
import {characterRoutes} from './controllers/character.js'
import {chatRoutes} from './controllers/chats.js'
import {messageRoutes} from './controllers/message.js'
import {settingsRoutes} from './controllers/prompt-settings.js'
import {generatePresetsRoutes} from './controllers/generate-presets.js'
import {modelRoutes} from './controllers/models.js'
import {generateRoutes} from './controllers/generate.js'

// Initialize a character for the user if it doesn't exist
const existingCharacter = await db.query.character.findFirst({where: eq(character.id, 1)})
console.log(existingCharacter)
if (!existingCharacter) {
    console.log('No character found, creating one')
    await db.insert(character).values({id: 1, name: 'User', description: 'The user.', type: 'user'})
}
// Create a default generate preset if it doesn't exist
const existingPreset = await db.query.generatePresets.findFirst({where: eq(generatePresets.id, 1)})
if (!existingPreset) {
    console.log('No generate preset found, creating one')
    await db.insert(generatePresets).values({
        id: 1,
        name: 'Default',
        maxTokens: 50,
        temperature: 0.5,
    })
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
await server.register(settingsRoutes, {prefix: '/api'})
await server.register(generatePresetsRoutes, {prefix: '/api'})
await server.register(modelRoutes, {prefix: '/api'})
await server.register(generateRoutes, {prefix: '/api'})

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
