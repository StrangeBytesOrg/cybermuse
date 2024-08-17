import fs from 'node:fs'
import path from 'node:path'
import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox'
import type {FastifyPluginAsync} from 'fastify'
import {Type as t} from '@sinclair/typebox'
import {type ChildProcessWithoutNullStreams, spawn} from 'node:child_process'
import chalk from 'chalk'
import {getConfig, setConfig} from '../config.js'
import {logger} from '../logging.js'
import {env} from '../env.js'

let llamaServerProc: ChildProcessWithoutNullStreams
let loaded = false
let currentModel: string = ''

// Cleanup subprocess on exit
process.on('exit', () => {
    if (llamaServerProc) {
        logger.info('Killing llama server')
        llamaServerProc.kill('SIGKILL')
    }
})

export const llamaServerRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/status',
        method: 'GET',
        schema: {
            operationId: 'GetLlamaServerStatus',
            tags: ['llama-server'],
            summary: 'Get status info about the server',
            response: {
                200: t.Object({
                    currentModel: t.String(),
                    modelPath: t.String(),
                    autoLoad: t.Boolean(),
                    loaded: t.Boolean(),
                    contextSize: t.Number(),
                    batchSize: t.Number(),
                    gpuLayers: t.Number(),
                    useFlashAttn: t.Boolean(),
                    splitMode: t.Union([t.Literal('row'), t.Literal('layer')]),
                    cacheTypeK: t.Union([t.Literal('f16'), t.Literal('q8_0'), t.Literal('q4_0')]),
                    cacheTypeV: t.Union([t.Literal('f16'), t.Literal('q8_0'), t.Literal('q4_0')]),
                }),
            },
        },
        handler: async () => {
            const config = getConfig()
            if (env.LLAMA_SERVER_URL) {
                loaded = true
            }
            return {
                loaded,
                currentModel,
                modelPath: config.modelsPath,
                autoLoad: config.autoLoad,
                contextSize: config.contextSize,
                batchSize: config.batchSize,
                gpuLayers: config.gpuLayers,
                useFlashAttn: config.useFlashAttn,
                splitMode: config.splitMode,
                cacheTypeK: config.cacheTypeK,
                cacheTypeV: config.cacheTypeV,
            }
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/start-server',
        method: 'POST',
        schema: {
            operationId: 'StartLlamaServer',
            tags: ['llama-server'],
            summary: 'Startup the llama server',
            body: t.Object({
                modelFile: t.String(),
                contextSize: t.Number(),
                batchSize: t.Number(),
                gpuLayers: t.Number(),
                useFlashAttn: t.Boolean(),
                splitMode: t.Union([t.Literal('row'), t.Literal('layer')]),
                cacheTypeK: t.Union([t.Literal('f16'), t.Literal('q8_0'), t.Literal('q4_0')]),
                cacheTypeV: t.Union([t.Literal('f16'), t.Literal('q8_0'), t.Literal('q4_0')]),
            }),
            response: {
                200: t.Object({
                    success: t.Boolean(),
                }),
            },
        },
        handler: async (req) => {
            const {modelFile, contextSize, batchSize, gpuLayers, useFlashAttn, splitMode, cacheTypeK, cacheTypeV} =
                req.body
            await startLlamaServer(
                modelFile,
                contextSize,
                batchSize,
                gpuLayers,
                useFlashAttn,
                splitMode,
                cacheTypeK,
                cacheTypeV,
            )
            return {success: true}
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/stop-server',
        method: 'POST',
        schema: {
            operationId: 'StopLlamaServer',
            tags: ['llama-server'],
            summary: 'Stop the llama server',
        },
        handler: async (request, reply) => {
            llamaServerProc.kill()
            if (llamaServerProc.killed) {
                return {success: true}
            } else {
                logger.error('Failed to kill llama server')
                return reply.status(500).send({message: 'Failed to kill server'})
            }
        },
    })
}

// TODO merge useGPU and gpuLayers into a single object
export const startLlamaServer = async (
    modelName: string,
    contextSize: number,
    batchSize: number = 512,
    gpuLayers: number = 0,
    useFlashAttn: boolean = false,
    splitMode: 'row' | 'layer' = 'row',
    cacheTypeK: 'f16' | 'q8_0' | 'q4_0' = 'f16',
    cacheTypeV: 'f16' | 'q8_0' | 'q4_0' = 'f16',
) => {
    let serverBinPath = path.resolve(import.meta.dirname, '../../llamacpp/llama-server')
    if (env.DEV) {
        serverBinPath = path.resolve(import.meta.dirname, '../../../llamacpp/llama-server')
    }
    if (process.platform === 'win32') {
        serverBinPath += '.exe'
    }
    logger.info(`LlamaCPP server bin path: ${serverBinPath}`)
    if (!fs.existsSync(serverBinPath)) {
        throw new Error('LlamaCPP Server binary not found')
    }

    const config = getConfig()
    const modelPath = path.resolve(config.modelsPath, modelName)
    logger.info(`Attempting to start server with model: ${modelPath}`)
    try {
        await fs.promises.access(modelPath, fs.constants.F_OK)
        const stats = await fs.promises.stat(modelPath)
        if (!stats.isFile()) {
            throw new Error('Model file not found')
        }
    } catch (err) {
        throw new Error('Model file not found or not accessible')
    }

    return new Promise((resolve, reject) => {
        const args: string[] = []
        args.push('--model', modelPath)
        args.push('--ctx-size', String(contextSize))
        args.push('--batch-size', String(batchSize))
        args.push('--log-disable') // Prevent creating a llama.log file
        args.push('--host', '0.0.0.0') // TODO make this configurable
        args.push('--port', '8080') // TODO make this configurable
        if (gpuLayers) {
            args.push('--gpu-layers', String(gpuLayers))
        }
        if (splitMode) {
            args.push('--split-mode', splitMode)
        }
        if (useFlashAttn) {
            args.push('--flash-attn')
        }
        if (cacheTypeK) {
            args.push('--cache-type-k', cacheTypeK)
        }
        if (cacheTypeV) {
            args.push('--cache-type-v', cacheTypeV)
        }
        logger.info(`llama-server args: ${args.join(' ')}`)

        llamaServerProc = spawn(serverBinPath, args, {})
        llamaServerProc.stdout.on('data', (data) => {
            const output: string = data.toString()
            process.stdout.write(chalk.cyan(output))
            if (output.includes('model loaded')) {
                logger.info('Detected model loaded')
                loaded = true
                currentModel = modelName
                config.lastModel = modelName
                config.contextSize = contextSize
                config.batchSize = batchSize
                config.gpuLayers = gpuLayers
                config.useFlashAttn = useFlashAttn
                config.splitMode = splitMode
                config.cacheTypeK = cacheTypeK
                config.cacheTypeV = cacheTypeV
                setConfig(config)
                resolve({success: true})
            }
        })

        llamaServerProc.stderr.on('data', (data) => {
            const output: string = data.toString()
            process.stderr.write(chalk.blue(output))
            if (output.includes('error')) {
                reject(new Error(output))
            }
        })

        llamaServerProc.on('error', (err) => {
            logger.error('LlamaCPP server error:', err)
        })

        llamaServerProc.on('exit', (code) => {
            logger.info(`Llama Server exited with code ${code}`)
            loaded = false
        })
    })
}
