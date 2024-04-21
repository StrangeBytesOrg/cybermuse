import fs from 'node:fs'
import {z} from 'zod'

const configSchema = z.object({
    modelDir: z.string(),
    autoLoad: z.boolean(),
    lastModel: z.string(),
})
type Config = z.infer<typeof configSchema>

export const getConfig = () => {
    const configPath = process.env.CONFIG_PATH
    if (!configPath) {
        throw new Error('CONFIG_PATH is not set')
    }

    if (!fs.existsSync(configPath)) {
        const defaultConfig = {modelDir: '', autoLoad: false, lastModel: ''}
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig))
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    const parsedConfig = configSchema.parse(config)
    return parsedConfig
}

export const setConfig = (config: Config) => {
    const configPath = process.env.CONFIG_PATH
    if (!configPath) {
        throw new Error('CONFIG_PATH is not set')
    }

    const parsedConfig = configSchema.parse(config)
    fs.writeFileSync(configPath, JSON.stringify(parsedConfig))
}
