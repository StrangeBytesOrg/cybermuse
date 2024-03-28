import path from 'node:path'
import fs from 'node:fs'
import {getLlama, LlamaCompletion, type LlamaModel, type LlamaContext} from 'node-llama-cpp'
import {app} from 'electron'

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
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
console.log(`Config path: ${configPath}`)

export const getStatus = () => {
    return {
        modelLoaded,
        currentModel,
        modelDir: config.modelDir,
    }
}

export const loadModel = async (modelName: string) => {
    console.log(`Loading Model: ${modelName}`)
    const modelPath = path.resolve(config.modelDir, modelName)
    const llama = await getLlama({
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

    const prompt = `<|im_start|>user\nHello<|im_end|>`
    const tokens = await model.tokenize(prompt)
    console.log('Prompt:', prompt)
    console.log('Tokens:', tokens)
}

export type GenerateParams = {
    prompt: string
    maxTokens: number
    temperature: number
    minP: number
    topP: number
    topK: number
    // repeatPenalty: number,
}

type Callback = (str: string) => void

export const generate = async (params: GenerateParams, cb: Callback) => {
    const tokens = await model.tokenize(params.prompt)
    console.log(params.prompt)
    console.log(tokens)

    const wat = await completion.generateCompletion(params.prompt, {
        maxTokens: params.maxTokens,
        temperature: params.temperature,
        minP: params.minP,
        topP: params.topP,
        topK: params.topK,
        // repeatPenalty: params.repeatPenalty,
        onToken: (token) => {
            const str = model.detokenize(token)
            cb(str)
        },
    })

    return wat
}

export const listModels = async () => {
    // TODO handle directories
    try {
        const models = fs.readdirSync(config.modelDir)
        const modelList = models.map((model) => {
            return {
                name: model,
            }
        })
        return modelList
    } catch (err) {
        console.error(err)
        return []
    }
}

export const setModelDir = async (dir: string) => {
    console.log(`Setting Model Folder: ${dir}`)
    config.modelDir = dir
    fs.writeFileSync(configPath, JSON.stringify(config))
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
