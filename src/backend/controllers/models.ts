import fs from 'node:fs'
import path from 'node:path'
import {z} from 'zod'
// import {fileExists} from '@huggingface/hub'
import {TRPCError} from '@trpc/server'
import {t} from '../trpc.js'
import {getConfig, setConfig} from '../config.js'
import {logger} from '../logging.js'

export const modelsRouter = t.router({
    getAll: t.procedure.query(async () => {
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
            return modelList
        } catch (err) {
            console.error(err)
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to get models',
            })
        }
    }),
    setModelPath: t.procedure.input(z.string()).mutation(async ({input: modelPath}) => {
        const config = getConfig()
        logger.info(`Setting Model Folder: ${modelPath}`)
        // Check if the directory exists
        if (!fs.existsSync(modelPath)) {
            logger.error('Directory does not exist')
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Directory does not exist',
            })
        }
        config.modelsPath = modelPath
        setConfig(config)
    }),
    setAutoLoad: t.procedure.input(z.boolean()).mutation(async ({input: autoLoad}) => {
        logger.info(`Setting Auto Load: ${autoLoad}`)
        const config = getConfig()
        config.autoLoad = autoLoad
        setConfig(config)
    }),
    // TODO implement
    downloadModel: t.procedure
        .input(
            z.object({
                repoId: z.string(),
                path: z.string(),
            }),
        )
        .mutation(async ({}) => {
            console.log('NEED TO IMPLEMENT')
            // // TODO handle canceling
            // const exists = await fileExists({repo: request.body.repoId, path: request.body.path})
            // if (!exists) {
            //     return reply.status(404).send({message: 'Model not found'})
            // }
            // const config = getConfig()
            // const response = await fetch(
            //     `https://huggingface.co/${request.body.repoId}/resolve/main/${request.body.path}`,
            // )
            // if (response.body === null || !response.ok) {
            //     logger.error('Failed to download model')
            //     return reply.status(500).send({message: 'Failed to download model'})
            // }
            // const reader = response.body.getReader()
            // const contentLength = Number(response.headers.get('content-length'))
            // logger.info(`Downloading ${request.body.path}, Size: ${(contentLength / 1024 / 1024).toFixed(2)} MB`)
            // const finalPath = path.resolve(config.modelsPath, request.body.path)
            // logger.info(`Model will be downloaded to: ${finalPath}`)
            // const fileStream = fs.createWriteStream(finalPath)
            // // Setup headers for server-sent events
            // reply.raw.setHeader('Content-Type', 'text/event-stream')
            // reply.raw.setHeader('Cache-Control', 'no-store')
            // reply.raw.setHeader('Connection', 'keep-alive')
            // reply.raw.setHeader('Access-Control-Allow-Origin', '*')
            // let receivedLength = 0
            // while (true) {
            //     const {done, value} = await reader.read()
            //     if (done) break
            //     fileStream.write(value)
            //     receivedLength += value.length
            //     const progress = (receivedLength / contentLength) * 100
            //     logger.info(`Progress: ${progress.toFixed(2)}%`)
            //     reply.raw.write(`event:progress\ndata: ${JSON.stringify({progress})}\n\n`)
            // }
            // fileStream.end()
            // logger.info('Model downloaded')
            // reply.raw.write(`event:final\ndata: {"progress": 100}\n\n`)
            // reply.raw.end()
            // request.socket.destroy()
        }),
})
