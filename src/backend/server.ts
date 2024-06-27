import {Elysia} from 'elysia'
import {cors} from '@elysiajs/cors'
import {swagger} from '@elysiajs/swagger'
import {getConfig} from './config'

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

const server = new Elysia()
server.use(cors())

// Register controller routes
server.group('/api', (group) => {
    group.use(
        swagger({
            path: '/docs',
            provider: 'swagger-ui',
            documentation: {
                servers: [{url: '/api'}],
                openapi: '3.1.0',
            },
            exclude: ['/docs', '/docs/json'],
        }),
    )
    group.use(characterRoutes)
    group.use(chatRoutes)
    group.use(generatePresetsRoutes)
    group.use(generateRoutes)
    group.use(llamaServerRoutes)
    group.use(messageRoutes)
    group.use(modelRoutes)
    group.use(templateRoutes)
    return group
})

// TODO add error handling
server.listen({port: config.serverPort, maxRequestBodySize: 1024 * 1024 * 5}, () => {
    console.log(`Server running on port ${config.serverPort}`)
})

process.on('SIGINT', () => {
    server.stop()
    process.exit()
})
