import {z} from 'zod'
import {t} from '../trpc.js'
import {getConfig, setConfig} from '../config.js'
import {loaded, currentModel, loadModel, unloadModel} from '../llama-cpp.js'
import {logger} from '../logging.js'

export const llamaCppRouter = t.router({
    status: t.procedure.query(async () => {
        const config = getConfig()
        return {
            loaded,
            currentModel,
            modelPath: config.modelsPath,
            autoLoad: config.autoLoad,
            contextSize: config.contextSize,
            batchSize: config.batchSize,
            gpuLayers: config.gpuLayers,
            useFlashAttn: config.useFlashAttn,
        }
    }),
    loadModel: t.procedure
        .input(
            z.object({
                modelFile: z.string(),
                contextSize: z.number(),
                batchSize: z.number(),
                gpuLayers: z.number(),
                useFlashAttn: z.boolean(),
            }),
        )
        .query(async ({input}) => {
            const {modelFile, contextSize, batchSize, gpuLayers, useFlashAttn} = input
            const config = getConfig()
            await loadModel(config.modelsPath, modelFile, contextSize, batchSize, gpuLayers, useFlashAttn)

            // Update the config
            config.lastModel = modelFile
            config.contextSize = contextSize
            config.batchSize = batchSize
            config.gpuLayers = gpuLayers
            config.useFlashAttn = useFlashAttn
            setConfig(config)
        }),
    unloadModel: t.procedure.query(async () => {
        await unloadModel()
        logger.info('model unloaded')
    }),
})
