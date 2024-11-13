import path from 'node:path'
import {getLlama, LlamaChat, JinjaTemplateChatWrapper, LlamaLogLevel} from 'node-llama-cpp'
import type {LlamaModel, ChatHistoryItem} from 'node-llama-cpp'
import {logger} from './logging.js'
import {env} from './env.js'

export const llama = await getLlama({
    logLevel: env.VERBOSE ? LlamaLogLevel.debug : LlamaLogLevel.warn,
})
let model: LlamaModel

export let loaded = false
export let currentModel: string = ''
export let llamaChat: LlamaChat

export const loadModel = async (
    modelPath: string,
    modelFile: string,
    contextSize: number,
    batchSize: number,
    gpuLayers: number,
    useFlashAttn: boolean,
) => {
    const fullModelPath = path.resolve(modelPath, modelFile)
    logger.info(`Attempting to load: ${fullModelPath}`)

    if (model && !model.disposed) {
        logger.info(`Disposing of previous model`)
        await model.dispose()
    }
    model = await llama.loadModel({
        modelPath: fullModelPath,
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
            joinAdjacentMessagesOfTheSameType: false,
        }),
        autoDisposeSequence: true,
    })
    loaded = true
    currentModel = modelFile
    logger.info(`Model loaded`)
}

export const unloadModel = async () => {
    if (loaded) {
        loaded = false
        currentModel = ''
        await model.dispose()
    }
}

type Message = {type: 'user' | 'model' | 'system'; content: string}
export const formatMessage = (message: Message): ChatHistoryItem => {
    switch (message.type) {
        case 'model':
            return {
                type: 'model',
                response: [message.content],
            }
        case 'user':
            return {
                type: 'user',
                text: message.content,
            }
        case 'system':
            return {
                type: 'system',
                text: message.content,
            }
        default:
            throw new Error(`Unknown message type: ${message.type}`)
    }
}
