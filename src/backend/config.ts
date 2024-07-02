import fs from 'node:fs'
import path from 'node:path'
import {z} from 'zod'
import envPaths from 'env-paths'
import {logger} from './logging.js'

const paths = envPaths('cybermuse-desktop', {suffix: ''})
const configPath = path.resolve(paths.config, 'config.json')

const configSchema = z.object({
    serverPort: z.number().default(31700),
    modelsPath: z.string().default(path.resolve(paths.config, 'models')),
    autoLoad: z.boolean().default(false),
    lastModel: z.string().default(''),
    useGPU: z.boolean().default(false),
    contextSize: z.number().default(8192),
})
type Config = z.infer<typeof configSchema>

// Create the app data directory if it doesn't exist
if (!fs.existsSync(paths.config)) {
    logger.info(`Creating config directory at ${paths.config}`)
    fs.mkdirSync(paths.config, {recursive: true})
}
// Make the models folder if it doesn't exist
const modelPath = path.resolve(paths.config, 'models')
if (!fs.existsSync(modelPath)) {
    logger.info(`Creating models directory at ${modelPath}`)
    fs.mkdirSync(modelPath)
}

export const getConfig = () => {
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        const parsedConfig = configSchema.parse(config)
        return parsedConfig
    } catch {
        logger.info('No config file found, using defaults')
        return configSchema.parse({})
    }
}

export const setConfig = (config: Config) => {
    const parsedConfig = configSchema.parse(config)
    fs.writeFileSync(configPath, JSON.stringify(parsedConfig, null, 2))
}
