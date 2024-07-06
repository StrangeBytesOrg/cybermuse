import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox'
import type {FastifyPluginAsync} from 'fastify'
import fs from 'node:fs'
import path from 'node:path'
import {Type as t} from '@sinclair/typebox'
import {fileExists} from '@huggingface/hub'
import {getConfig, setConfig} from '../config.js'
import {logger} from '../logging.js'

export const modelRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/models',
        method: 'GET',
        schema: {
            operationId: 'GetAllModels',
            tags: ['models'],
            summary: 'Get all models',
            response: {
                200: t.Object({
                    models: t.Array(
                        t.Object({
                            name: t.String(),
                            size: t.Number(),
                        }),
                    ),
                }),
            },
        },
        handler: async () => {
            try {
                const config = getConfig()
                logger.debug(`Models path: ${config.modelsPath}`)
                const models = fs.readdirSync(config.modelsPath, {withFileTypes: true, recursive: true})
                const modelList = []
                for (let i = 0; i < models.length; i++) {
                    const model = models[i]
                    if (model.isFile() && model.name.endsWith('.gguf')) {
                        const modelSize = fs.statSync(path.join(model.parentPath, model.name)).size
                        modelList.push({name: model.name, size: modelSize})
                    }
                }
                return {models: modelList}
            } catch (err) {
                console.error(err)
                throw new Error('Failed to get models')
            }
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/download-model',
        method: 'POST',
        schema: {
            operationId: 'DownloadModel',
            tags: ['models'],
            summary: 'Download a model',
            body: t.Object({
                repoId: t.String(),
                path: t.String(),
            }),
        },
        handler: async (request, reply) => {
            // TODO handle canceling
            const exists = await fileExists({repo: request.body.repoId, path: request.body.path})
            if (!exists) {
                return reply.status(404).send({message: 'Model not found'})
            }

            const config = getConfig()
            const response = await fetch(
                `https://huggingface.co/${request.body.repoId}/resolve/main/${request.body.path}`,
            )
            if (response.body === null || !response.ok) {
                logger.error('Failed to download model')
                return reply.status(500).send({message: 'Failed to download model'})
            }
            const reader = response.body.getReader()
            const contentLength = Number(response.headers.get('content-length'))
            logger.info(`Downloading ${request.body.path}, Size: ${(contentLength / 1024 / 1024).toFixed(2)} MB`)

            const finalPath = path.resolve(config.modelsPath, request.body.path)
            logger.info(`Model will be downloaded to: ${finalPath}`)
            const fileStream = fs.createWriteStream(finalPath)

            // Setup headers for server-sent events
            reply.raw.setHeader('Content-Type', 'text/event-stream')
            reply.raw.setHeader('Cache-Control', 'no-store')
            reply.raw.setHeader('Connection', 'keep-alive')
            reply.raw.setHeader('Access-Control-Allow-Origin', '*')

            let receivedLength = 0
            while (true) {
                const {done, value} = await reader.read()
                if (done) break
                fileStream.write(value)
                receivedLength += value.length
                const progress = (receivedLength / contentLength) * 100
                logger.info(`Progress: ${progress.toFixed(2)}%`)
                reply.raw.write(`event:progress\ndata: ${JSON.stringify({progress})}\n\n`)
            }
            fileStream.end()
            logger.info('Model downloaded')
            reply.raw.write(`event:final\ndata: {"progress": 100}\n\n`)
            reply.raw.end()
            request.socket.destroy()
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/set-model-path',
        method: 'POST',
        schema: {
            operationId: 'SetModelPath',
            tags: ['models'],
            summary: 'Set the model folder',
            body: t.Object({
                modelPath: t.String(),
            }),
            response: {
                400: t.Object({
                    message: t.String(),
                }),
            },
        },
        handler: async (req, reply) => {
            const config = getConfig()
            logger.info(`Setting Model Folder: ${req.body.modelPath}`)
            // Check if the directory exists
            if (!fs.existsSync(req.body.modelPath)) {
                logger.error('Directory does not exist')
                return reply.status(400).send({message: 'Directory does not exist'})
            }
            config.modelsPath = req.body.modelPath
            setConfig(config)
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/set-autoload',
        method: 'POST',
        schema: {
            operationId: 'SetAutoLoad',
            tags: ['models'],
            summary: 'Set auto load',
            body: t.Object({
                autoLoad: t.Boolean(),
            }),
        },
        handler: async (req) => {
            const autoLoad = req.body.autoLoad
            logger.info(`Setting Auto Load: ${autoLoad}`)
            const config = getConfig()
            config.autoLoad = autoLoad
            setConfig(config)
        },
    })
}
