import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox'
import type {FastifyPluginAsync} from 'fastify'
import {Type as t} from '@sinclair/typebox'
import {getConfig, setConfig} from '../config.js'
import {loaded, currentModel, loadModel, unloadModel} from '../llama-cpp.js'

export const llamaCppRoutes: FastifyPluginAsync = async (fastify) => {
    const f = fastify.withTypeProvider<TypeBoxTypeProvider>()
    f.route({
        url: '/status',
        method: 'GET',
        schema: {
            operationId: 'GetLlamaServerStatus',
            tags: ['llama-cpp'],
            summary: 'Get status info about model settings and the currently loaded model',
            response: {
                200: t.Object({
                    // TODO most of these could probably be auto-detected from config
                    currentModel: t.String(),
                    modelPath: t.String(),
                    autoLoad: t.Boolean(),
                    loaded: t.Boolean(),
                    contextSize: t.Number(),
                    batchSize: t.Number(),
                    gpuLayers: t.Number(),
                    useFlashAttn: t.Boolean(),
                }),
            },
        },
        handler: async () => {
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
        },
    })

    f.route({
        url: '/load-model',
        method: 'POST',
        schema: {
            operationId: 'LoadModel',
            tags: ['llama-cpp'],
            summary: 'Load a model',
            body: t.Object({
                modelFile: t.String(),
                contextSize: t.Number(),
                batchSize: t.Number(),
                gpuLayers: t.Number(),
                useFlashAttn: t.Boolean(),
            }),
            response: {
                200: t.Object({
                    success: t.Boolean(),
                }),
            },
        },
        handler: async (req) => {
            const {modelFile, contextSize, batchSize, gpuLayers, useFlashAttn} = req.body
            const config = getConfig()
            await loadModel(config.modelsPath, modelFile, contextSize, batchSize, gpuLayers, useFlashAttn)

            // Update the config
            config.lastModel = modelFile
            config.contextSize = contextSize
            config.batchSize = batchSize
            config.gpuLayers = gpuLayers
            config.useFlashAttn = useFlashAttn
            setConfig(config)
            return {success: true}
        },
    })

    f.route({
        url: '/unload-model',
        method: 'POST',
        schema: {
            operationId: 'UnloadModel',
            tags: ['llama-cpp'],
            summary: 'Unload the current model',
            response: {
                200: t.Object({
                    success: t.Boolean(),
                }),
            },
        },
        handler: async () => {
            await unloadModel()
            return {success: true}
        },
    })
}
