import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import {getLlama, LlamaCompletion, type LlamaModel, type LlamaContext} from 'node-llama-cpp'

let model: LlamaModel
let context: LlamaContext
let completion: LlamaCompletion
let modelDir: string = path.resolve(os.homedir(), 'models')
let currentModel: string = ''
let modelLoaded = false

export const getStatus = () => {
    return {
        modelLoaded,
        currentModel,
        modelDir,
    }
}

export const loadModel = async (modelName: string) => {
    console.log(`Loading Model: ${modelName}`)
    const modelPath = path.resolve(modelDir, modelName)
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

export const generate = async (prompt: string) => {
    // const tokens = model.tokenize(prompt)

    const wat = await completion.generateCompletion(prompt, {
        maxTokens: 16,
    })

    return wat
}

export const listModels = async () => {
    // TODO handle directories
    const models = fs.readdirSync(modelDir)
    const modelList = models.map((model) => {
        return {
            name: model,
        }
    })
    return modelList
}

export const setModelDir = async (dir: string) => {
    console.log(`Setting Model Folder: ${dir}`)
    modelDir = dir
}
