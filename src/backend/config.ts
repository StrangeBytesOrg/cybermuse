import fs from 'node:fs'
import path from 'node:path'
import {z} from 'zod'
import {logger} from './logging.js'
import {paths, modelsPath} from './paths.js'

const configFile = path.resolve(paths.config, 'config.json')
logger.info(`Config file: ${configFile}`)

const configSchema = z.object({
    serverPort: z.number().default(31700),
    modelsPath: z.string().default(modelsPath),
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

export const getConfig = () => {
    try {
        const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'))
        const parsedConfig = configSchema.parse(config)
        return parsedConfig
    } catch {
        logger.info('No config file found, using defaults')
        return configSchema.parse({})
    }
}

export const setConfig = (config: Config) => {
    const parsedConfig = configSchema.parse(config)
    fs.writeFileSync(configFile, JSON.stringify(parsedConfig, null, 2))
}
