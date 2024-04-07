import path from 'node:path'
import fs from 'node:fs'
import {
    getLlama,
    LlamaCompletion,
    LlamaJsonSchemaGrammar,
    type Llama,
    type LlamaModel,
    type LlamaContext,
    type LlamaCompletionGenerationOptions,
    type Token,
    type GbnfJsonSchema,
} from 'node-llama-cpp'
import {app} from 'electron'

let llama: Llama
let model: LlamaModel
let context: LlamaContext
let jsonContext: LlamaContext
let completion: LlamaCompletion
let jsonCompletion: LlamaCompletion
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
    jsonContext = await model.createContext({
        contextSize: 512,
    })
    completion = new LlamaCompletion({
        contextSequence: context.getSequence(),
    })
    jsonCompletion = new LlamaCompletion({
        contextSequence: jsonContext.getSequence(),
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
    const tokens = model.tokenize(prompt, true)
    return await completion.generateCompletion(tokens, params)
}

export const generateJson = async (
    prompt: string,
    params: LlamaCompletionGenerationOptions,
    schema: GbnfJsonSchema,
) => {
    console.log(prompt)
    let started = false
    const grammar = new LlamaJsonSchemaGrammar(llama, schema)
    params.grammar = grammar
    params.onToken = (token) => {
        // console.log(model.detokenize(token))
        if (!started) {
            console.time('json-generation')
            started = true
        }
    }
    const tokens = model.tokenize(prompt, true)
    console.time('json-generation')
    const wat = await jsonCompletion.generateCompletion(tokens, params)
    console.timeEnd('json-generation')
    return wat
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
