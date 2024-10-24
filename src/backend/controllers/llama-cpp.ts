import path from 'node:path'
import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox'
import type {FastifyPluginAsync} from 'fastify'
import {Type as t} from '@sinclair/typebox'
import {logger} from '../logging.js'
import {getLlama, LlamaChat, JinjaTemplateChatWrapper} from 'node-llama-cpp'
import type {LlamaModel, ChatHistoryItem} from 'node-llama-cpp'
import {getConfig, setConfig} from '../config.js'

const llama = await getLlama()
let model: LlamaModel
let loaded = false
let currentModel: string = ''

export let llamaChat: LlamaChat

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
            await loadModel(modelFile, contextSize, batchSize, gpuLayers, useFlashAttn)
            // Update the config
            const config = getConfig()
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
            if (loaded) {
                loaded = false
                currentModel = ''
                model.dispose()
            }
            return {success: true}
        },
    })
}

export const loadModel = async (
    modelFile: string,
    contextSize: number,
    batchSize: number,
    gpuLayers: number,
    useFlashAttn: boolean,
) => {
    const config = getConfig()
    const modelPath = path.resolve(config.modelsPath, modelFile)
    logger.info(`Attempting to load: ${modelPath}`)

    if (model && !model.disposed) {
        logger.info(`Disposing of previous model`)
        await model.dispose()
    }
    model = await llama.loadModel({
        modelPath,
        gpuLayers,
    })
    const context = await model.createContext({
        contextSize,
        batchSize,
        flashAttention: useFlashAttn,
    })
    // TODO fallback to chatML if no template
    const template = model.fileInfo.metadata.tokenizer.chat_template || ''
    llamaChat = new LlamaChat({
        contextSequence: context.getSequence(),
        chatWrapper: new JinjaTemplateChatWrapper({
            template,
        }),
        autoDisposeSequence: true,
    })
    loaded = true
    currentModel = modelFile
    logger.info(`Model loaded`)
}

type Message = {type: 'user' | 'model' | 'system'; content: string}
export const formatMessage = (message: Message): ChatHistoryItem => {
    if (message.type === 'model') {
        return {
            type: 'model',
            response: [message.content],
        }
    } else {
        return {
            type: 'user',
            text: message.content,
        }
    }
}
