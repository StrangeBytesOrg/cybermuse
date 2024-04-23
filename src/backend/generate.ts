import path from 'node:path'
import {
    getLlama,
    LlamaCompletion,
    LlamaJsonSchemaGrammar,
    LlamaGrammar,
    type Llama,
    type LlamaModel,
    type LlamaContext,
    type LlamaCompletionGenerationOptions,
    type Token,
    type GbnfJsonSchema,
} from 'node-llama-cpp'
import {getConfig, setConfig} from './config.js'

let llama: Llama
let model: LlamaModel
let context: LlamaContext
let completion: LlamaCompletion
let currentModel: string = ''
let modelLoaded = false

export const getStatus = () => {
    const config = getConfig()
    return {
        modelLoaded,
        currentModel,
        modelDir: config.modelDir,
        autoLoad: config.autoLoad,
    }
}

export const loadModel = async (modelName: string) => {
    console.log(`Loading Model: ${modelName}`)
    const config = getConfig()
    const modelPath = path.resolve(config.modelDir, modelName)
    llama = await getLlama({
        gpu: false, // TODO Use config
    })
    model = await llama.loadModel({modelPath})
    context = await model.createContext({
        contextSize: 2048,
    })
    completion = new LlamaCompletion({
        contextSequence: context.getSequence(),
    })
    currentModel = modelName
    modelLoaded = true
    config.lastModel = modelName
    setConfig(config)

    console.log('Model Loaded')
    console.log(`Sequences Left: ${context.sequencesLeft}`)
    console.log(`Total Sequences: ${context.totalSequences}`)
}

export const generate = async (prompt: string, params: LlamaCompletionGenerationOptions) => {
    // Tokenize first so that special tokens are handled correctly
    const startTime = performance.now()
    const tokens = model.tokenize(prompt, true)
    // console.log(tokens)
    const timeTaken = performance.now() - startTime
    console.log(`Tokenization time: ${timeTaken.toFixed(2)}ms`)
    return await completion.generateCompletion(tokens, params)
}

export const detokenize = (tokens: Token[]) => {
    return model.detokenize(tokens)
}

export const getGrammar = (gbnfString: string) => {
    return new LlamaGrammar({llama, grammar: gbnfString})
}

export const getJsonGrammar = (schema: GbnfJsonSchema) => {
    return new LlamaJsonSchemaGrammar(llama, schema)
}
