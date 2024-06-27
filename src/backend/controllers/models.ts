import {Elysia, t} from 'elysia'
import fs from 'node:fs'
import path from 'node:path'
import {fileExists} from '@huggingface/hub'
import {getConfig, setConfig} from '../config.js'

export const modelRoutes = new Elysia()
modelRoutes.get(
    '/models',
    async () => {
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
    },
    {
        tags: ['models'],
        detail: {
            operationId: 'GetAllModels',
            summary: 'Get all models',
        },
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
)

modelRoutes.post(
    '/download-model',
    async ({body}) => {
        const exists = await fileExists({repo: body.repoId, path: body.path})
        if (!exists) {
            return {success: false}
        }

        const config = getConfig()
        const response = await fetch(`https://huggingface.co/${body.repoId}/resolve/main/${body.path}`)
        if (response.body === null || !response.ok) {
            console.error('Failed to download model')
            return {success: false}
        }
        const reader = response.body.getReader()
        const contentLength = Number(response.headers.get('content-length'))
        console.log(`Downloading ${body.path}, Size: ${(contentLength / 1024 / 1024).toFixed(2)} MB`)

        const finalPath = path.resolve(config.modelsPath, body.path)
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
    {
        tags: ['models'],
        detail: {
            operationId: 'DownloadModel',
            summary: 'Download a model',
        },
        body: t.Object({
            repoId: t.String(),
            path: t.String(),
        }),
        response: {
            200: t.Object({
                success: t.Boolean(),
            }),
        },
    },
)

modelRoutes.post(
    '/set-model-path',
    async ({body}) => {
        const config = getConfig()
        console.log(`Setting Model Folder: ${body.modelPath}`)
        // Check if the directory exists
        if (!fs.existsSync(body.modelPath)) {
            console.log('Directory does not exist')
            throw new Error('Model path does not exist')
        }
        config.modelsPath = body.modelPath
        setConfig(config)
    },
    {
        tags: ['models'],
        detail: {
            operationId: 'SetModelPath',
            summary: 'Set the model folder',
        },
        body: t.Object({
            modelPath: t.String(),
        }),
        response: {
            400: t.Object({
                message: t.String(),
            }),
        },
    },
)

modelRoutes.post(
    '/set-autoload',
    async ({body}) => {
        const autoLoad = body.autoLoad
        console.log(`Setting Auto Load: ${autoLoad}`)
        const config = getConfig()
        config.autoLoad = autoLoad
        setConfig(config)
    },
    {
        tags: ['models'],
        detail: {
            operationId: 'SetAutoLoad',
            summary: 'Set auto load',
        },
        body: t.Object({
            autoLoad: t.Boolean(),
        }),
    },
)
