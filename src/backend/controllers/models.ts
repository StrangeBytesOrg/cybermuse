import type {ZodTypeProvider} from 'fastify-type-provider-zod'
import type {FastifyPluginAsync} from 'fastify'
import fs from 'node:fs'
import path from 'node:path'
import {z} from 'zod'
import {fileExists} from '@huggingface/hub'
import {getConfig, setConfig} from '../config.js'

export const modelRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/models',
        method: 'GET',
        schema: {
            summary: 'Get all models',
            response: {
                200: z.object({
                    models: z.array(
                        z.object({
                            name: z.string(),
                            size: z.number(),
                        }),
                    ),
                }),
            },
        },
        handler: async () => {
            try {
                const config = getConfig()
                console.log('Models Path: ', config.modelsPath)
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

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/download-model',
        method: 'POST',
        schema: {
            summary: 'Download a model',
            body: z.object({
                repoId: z.string(),
                path: z.string(),
            }),
            response: {
                200: z.object({
                    success: z.boolean(),
                }),
            },
        },
        handler: async (req) => {
            const exists = await fileExists({repo: req.body.repoId, path: req.body.path})
            if (!exists) {
                return {success: false}
            }

            const config = getConfig()
            const response = await fetch(`https://huggingface.co/${req.body.repoId}/resolve/main/${req.body.path}`)
            const reader = response.body.getReader()
            const contentLength = Number(response.headers.get('content-length'))
            console.log(`Downloading ${req.body.path}, Size: ${(contentLength / 1024 / 1024).toFixed(2)} MB`)

            const finalPath = path.resolve(config.modelDir, req.body.path)
            console.log(`Model will be downloaded to: ${finalPath}`)
            const fileStream = fs.createWriteStream(finalPath)

            let receivedLength = 0
            while (true) {
                const {done, value} = await reader.read()
                if (done) break
                fileStream.write(value)
                receivedLength += value.length
                const progress = receivedLength / contentLength
                console.log(`Progress: ${(progress * 100).toFixed(2)}%`)
            }
            fileStream.end()
            return {success: true}
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/set-model-path',
        method: 'POST',
        schema: {
            summary: 'Set the model folder',
            body: z.object({
                modelPath: z.string(),
            }),
            response: {
                400: z.object({
                    message: z.string(),
                }),
            },
        },
        handler: async (req, reply) => {
            const config = getConfig()
            console.log(`Setting Model Folder: ${req.body.modelPath}`)
            // Check if the directory exists
            if (!fs.existsSync(req.body.modelPath)) {
                console.log('Directory does not exist')
                return reply.status(400).send({message: 'Directory does not exist'})
            }
            config.modelsPath = req.body.modelPath
            setConfig(config)
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/set-autoload',
        method: 'POST',
        schema: {
            summary: 'Set auto load',
            body: z.object({
                autoLoad: z.boolean(),
            }),
        },
        handler: async (req) => {
            const autoLoad = req.body.autoLoad
            console.log(`Setting Auto Load: ${autoLoad}`)
            const config = getConfig()
            config.autoLoad = autoLoad
            setConfig(config)
        },
    })
}
