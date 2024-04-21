import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import {serializerCompiler, validatorCompiler, jsonSchemaTransform} from 'fastify-type-provider-zod'
import {eq} from 'drizzle-orm'
import {db, character, generatePresets, promptSetting} from './db.js'

// Routes
import {characterRoutes} from './controllers/character.js'
import {chatRoutes} from './controllers/chats.js'
import {messageRoutes} from './controllers/message.js'
import {promptSettingsRoutes} from './controllers/prompt-settings.js'
import {generatePresetsRoutes} from './controllers/generate-presets.js'
import {modelRoutes} from './controllers/models.js'
import {generateRoutes} from './controllers/generate.js'
import {settingsRoutes} from './controllers/settings.js'

// TODO put these into a script or something
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
// Create a default prompt setting if it doesn't exist
const existingPromptPreset = await db.query.promptSetting.findFirst({where: eq(promptSetting.id, 1)})
if (!existingPromptPreset) {
    await db.insert(promptSetting).values({
        name: 'ChatML',
        promptTemplate:
            '<|im_start|>system\n{{instruction}}\nThe following are descriptions of each character in the dialogue.\n{% for character in characters %}\nDescription of {{character.name}}: {{character.description}}\n{% endfor %}<|im_end|>\n{% for message in messages %}\n<|im_start|>{{"user" if message.character.type == "user" else "assistant"}}\n{{message.character.name}}: {{message.text}}<|im_end|>\n{% endfor %}\n<|im_start|>assistant\n',
        instruction:
            'Write a single response to the dialogue. Roleplay as the chosen character, and respond to the previous messages.',
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
await server.register(generatePresetsRoutes, {prefix: '/api'})
await server.register(modelRoutes, {prefix: '/api'})
await server.register(generateRoutes, {prefix: '/api'})
await server.register(settingsRoutes, {prefix: '/api'})
await server.register(promptSettingsRoutes, {prefix: '/api'})
