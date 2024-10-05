import fs from 'node:fs'
import path from 'node:path'
import {z} from 'zod'
import {logger} from './logging.js'
import {paths} from './paths.js'

const configPath = path.resolve(paths.config, 'config.json')
logger.info(`Config path: ${configPath}`)

const configSchema = z.object({
    serverPort: z.number().default(31700),
    modelsPath: z.string().default(path.resolve(paths.config, 'models')),
    autoLoad: z.boolean().default(false),
    lastModel: z.string().default(''),
    contextSize: z.number().default(8192),
    batchSize: z.number().default(512),
    gpuLayers: z.number().default(0),
    useFlashAttn: z.boolean().default(false),
    splitMode: z.enum(['row', 'layer', 'none']).default('row'),
    cacheTypeK: z.enum(['f16', 'q8_0', 'q4_0']).default('f16'),
    cacheTypeV: z.enum(['f16', 'q8_0', 'q4_0']).default('f16'),
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
