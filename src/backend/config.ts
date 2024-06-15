import fs from 'node:fs'
import path from 'node:path'
import {z} from 'zod'
import appDataPath from './util/app-data.js'

const configPath = path.resolve(appDataPath, 'config.json')

const configSchema = z.object({
    serverPort: z.number(),
    modelsPath: z.string(),
    autoLoad: z.boolean(),
    lastModel: z.string(),
    useGPU: z.boolean(),
    contextSize: z.number(),
})
type Config = z.infer<typeof configSchema>

// Create the app data directory if it doesn't exist
if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath, {recursive: true})
}

export const getConfig = () => {
    if (!fs.existsSync(configPath)) {
        const defaultConfig: Config = {
            serverPort: 31700,
            modelsPath: path.resolve(appDataPath, 'models'),
            autoLoad: false,
            lastModel: '',
            useGPU: false,
            contextSize: 8192,
        }
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))

        // Make the models folder if it doesn't exist
        const modelPath = path.resolve(appDataPath, 'models')
        if (!fs.existsSync(modelPath)) {
            fs.mkdirSync(modelPath)
        }
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    const parsedConfig = configSchema.parse(config)
    return parsedConfig
}

export const setConfig = (config: Config) => {
    const parsedConfig = configSchema.parse(config)
    fs.writeFileSync(configPath, JSON.stringify(parsedConfig, null, 2))
}
