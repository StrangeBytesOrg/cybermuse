import path from 'node:path'
import fs from 'node:fs'
import {
    getLlama,
    LlamaCompletion,
    type Llama,
    type LlamaModel,
    type LlamaContext,
    type LlamaCompletionGenerationOptions,
    type Token,
} from 'node-llama-cpp'
import {app} from 'electron'

let llama: Llama
let model: LlamaModel
let context: LlamaContext
let completion: LlamaCompletion
let currentModel: string = ''
let modelLoaded = false

// Create a local config file if it doesn't exist
const configPath = path.resolve(app.getPath('userData'), 'config.json')
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({modelDir: '', autoLoad: false, lastModel: ''}))
}
export const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
console.log(`Config path: ${configPath}`)

export const getStatus = () => {
    return {
        modelLoaded,
        currentModel,
        modelDir: config.modelDir,
        autoLoad: config.autoLoad,
    }
}

export const loadModel = async (modelName: string) => {
    console.log(`Loading Model: ${modelName}`)
    const modelPath = path.resolve(config.modelDir, modelName)
    llama = await getLlama({
        gpu: false,
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
    fs.writeFileSync(configPath, JSON.stringify(config))

    console.log('Model Loaded')
    console.log(`Sequences Left: ${context.sequencesLeft}`)
    console.log(`Total Sequences: ${context.totalSequences}`)
}

export const generate = async (prompt: string, params: LlamaCompletionGenerationOptions) => {
    // Tokenize first so that special tokens are handled correctly
    const tokens = await model.tokenize(prompt, true)
    return await completion.generateCompletion(tokens, params)
}

export const detokenize = (tokens: Token[]) => {
    return model.detokenize(tokens)
}

export const setAutoLoad = async (autoLoad: boolean) => {
    console.log(`Setting Auto Load: ${autoLoad}`)
    config.autoLoad = autoLoad
    fs.writeFileSync(configPath, JSON.stringify(config))
}

if (config.autoLoad && config.lastModel) {
    console.log('Auto Loading Last Model', config.lastModel)
    loadModel(config.lastModel)
}
