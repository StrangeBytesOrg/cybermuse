import fs from 'node:fs'
import path from 'node:path'
import {z} from 'zod'
import appDataPath from './app-data.js'

const configPath = path.resolve(appDataPath, 'config.json')

const configSchema = z.object({
    serverPort: z.number(),
    modelDir: z.string(),
    autoLoad: z.boolean(),
    lastModel: z.string(),
})
type Config = z.infer<typeof configSchema>

export const getConfig = () => {
    if (!fs.existsSync(configPath)) {
        const defaultConfig: Config = {serverPort: 31700, modelDir: '', autoLoad: false, lastModel: ''}
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    const parsedConfig = configSchema.parse(config)
    return parsedConfig
}

export const setConfig = (config: Config) => {
    const parsedConfig = configSchema.parse(config)
    fs.writeFileSync(configPath, JSON.stringify(parsedConfig, null, 2))
}
