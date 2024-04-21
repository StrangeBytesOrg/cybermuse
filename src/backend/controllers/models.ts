import type {ZodTypeProvider} from 'fastify-type-provider-zod'
import type {FastifyPluginAsync} from 'fastify'
import fs from 'node:fs'
import path from 'node:path'
import {z} from 'zod'
import {fileExists} from '@huggingface/hub'
import {loadModel} from '../generate.js'
import {getConfig, setConfig} from '../config.js'

export const modelRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/models',
        method: 'GET',
        schema: {
            summary: 'Get all models',
            response: {
                200: z.array(
                    z.object({
                        name: z.string(),
                    }),
                ),
            },
        },
        handler: async () => {
            try {
                const config = getConfig()
                const models = fs.readdirSync(config.modelDir, {withFileTypes: true, recursive: true})
                const modelList = []
                for (let i = 0; i < models.length; i++) {
                    const model = models[i]
                    if (model.isFile() && model.name.endsWith('.gguf')) {
                        modelList.push({name: model.name})
                    }
                }
                return modelList
            } catch (err) {
                console.error(err)
                return []
            }
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/load-model',
        method: 'POST',
        schema: {
            summary: 'Load a model',
            body: z.object({
                modelName: z.string(),
            }),
            response: {
                200: z.object({
                    success: z.boolean(),
                }),
            },
        },
        handler: async (req) => {
            const modelName = req.body.modelName
            if (modelName) {
                await loadModel(modelName)
                return {success: true}
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
        url: '/set-model-dir',
        method: 'POST',
        schema: {
            summary: 'Set the model folder',
            body: z.object({
                dir: z.string(),
            }),
            response: {
                200: z.object({
                    success: z.boolean(),
                }),
                400: z.object({
                    message: z.string(),
                }),
            },
        },
        handler: async (req, reply) => {
            const dir = req.body.dir
            const config = getConfig()
            console.log(`Setting Model Folder: ${dir}`)
            // Check if the directory exists
            if (!fs.existsSync(dir)) {
                console.log('Directory does not exist')
                return reply.status(400).send({message: 'Directory does not exist'})
            }
            config.modelDir = dir
            setConfig(config)
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/set-auto-load',
        method: 'POST',
        schema: {
            summary: 'Set auto load',
            body: z.object({
                autoLoad: z.boolean(),
            }),
            response: {
                200: z.object({
                    success: z.boolean(),
                }),
            },
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
