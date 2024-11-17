import fs from 'node:fs'
import path from 'node:path'
import {z} from 'zod'
import {createModelDownloader} from 'node-llama-cpp'
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
                repo: z.string(),
                filename: z.string(),
            }),
        )
        .mutation(async function* ({input, signal}) {
            const {repo, filename} = input

            logger.info('Downloading model', `${repo}/${filename}`)
            signal?.addEventListener('abort', () => {
                logger.info('Download aborted')
                // TODO implement abort
            })

            const chunkStream = new ReadableStream({
                async start(controller) {
                    const downloader = await createModelDownloader({
                        modelUri: `hf:${repo}/${filename}`,
                        dirPath: getConfig().modelsPath,
                        onProgress: (progress) => {
                            const percentage = Math.floor((progress.downloadedSize / progress.totalSize) * 100)
                            logger.debug(`Progress: ${percentage}%`)
                            controller.enqueue({progress: percentage})
                        },
                    })
                    await downloader.download()
                    logger.info('Model downloaded')
                    controller.close()
                },
            })

            let lastEmit = ''
            const reader = chunkStream.getReader()
            while (true) {
                const {done, value} = await reader.read()
                if (done) break
                if (value.progress !== lastEmit) {
                    lastEmit = value.progress
                    yield value
                }
            }
        }),
})
