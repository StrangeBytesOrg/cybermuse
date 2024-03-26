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
    fs.writeFileSync(configPath, JSON.stringify({modelDir: ''}))
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

    console.log('Model Loaded')
    console.log(`Sequences Left: ${context.sequencesLeft}`)
    console.log(`Total Sequences: ${context.totalSequences}`)
}

export const generate = async (prompt: string, cb) => {
    const wat = await completion.generateCompletion(prompt, {
        maxTokens: 16,
        onToken: (token) => {
            const str = model.detokenize(token)
            console.log(token, str)
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
