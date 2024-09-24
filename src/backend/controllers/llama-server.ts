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
import {chatTemplates} from '../prompt.js'

let llamaServerProc: ChildProcessWithoutNullStreams
let loaded = false
export let currentModel: string = ''
export let currentTemplate: string

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
                    // TODO most of these could probably be auto-detected from config
                    currentModel: t.String(),
                    modelPath: t.String(),
                    autoLoad: t.Boolean(),
                    loaded: t.Boolean(),
                    contextSize: t.Number(),
                    batchSize: t.Number(),
                    gpuLayers: t.Number(),
                    useFlashAttn: t.Boolean(),
                    splitMode: t.Union([t.Literal('row'), t.Literal('layer'), t.Literal('none')]),
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
                splitMode: t.Union([t.Literal('row'), t.Literal('layer'), t.Literal('none')]),
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

// TODO add custom args as a text input so the user can use any not implemented settings
export const startLlamaServer = async (
    modelName: string,
    contextSize: number,
    batchSize: number = 512,
    gpuLayers: number = 0,
    useFlashAttn: boolean = false,
    splitMode: 'row' | 'layer' | 'none',
    cacheTypeK: 'f16' | 'q8_0' | 'q4_0',
    cacheTypeV: 'f16' | 'q8_0' | 'q4_0',
    chatTemplate?: string,
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
        // args.push('--verbose')
        args.push('--model', modelPath)
        args.push('--ctx-size', String(contextSize))
        args.push('--batch-size', String(batchSize))
        // TODO u-batch size seems important
        args.push('--host', '0.0.0.0') // TODO make this configurable
        args.push('--port', '8080') // TODO make this configurable
        args.push('--log-prefix')
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
        if (chatTemplate) {
            args.push('--chat-template', chatTemplate)
        }
        logger.info(`llama-server args: ${args.join(' ')}`)
        llamaServerProc = spawn(serverBinPath, args, {})

        let stdErrBuffer = ''
        llamaServerProc.stderr.on('data', (data) => {
            const output: string = data.toString()
            // process.stderr.write(chalk.blue(output))
            stdErrBuffer += output
            let newlineIndex: number
            while ((newlineIndex = stdErrBuffer.indexOf('\n')) !== -1) {
                const line = stdErrBuffer.slice(0, newlineIndex)
                stdErrBuffer = stdErrBuffer.slice(newlineIndex + 1)
                if (line.startsWith('E ')) {
                    logger.error('LlamaCpp Error: ', line)
                }
                if (line.includes('model loaded')) {
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
                if (line.includes('chat_example:')) {
                    const example = line.split(`chat_example: '`)[1].trim()
                    let foundTemplate = false
                    logger.debug('Chat example:', example)
                    for (const templateName in chatTemplates) {
                        if (example === chatTemplates[templateName].example) {
                            currentTemplate = templateName
                            foundTemplate = true
                            logger.info(`Detected chat example: ${templateName}`)
                            break
                        }
                    }
                    if (!foundTemplate) {
                        currentTemplate = 'chatml'
                        logger.error(`Unknown chat example: ${example}, falling back to chatml`)
                        logger.info(`Chat example: ${example}`)
                    }
                }
            }
        })

        llamaServerProc.stdout.on('data', (data) => {
            const output: string = data.toString()
            process.stdout.write(chalk.cyan(output))
        })

        llamaServerProc.on('error', (err) => {
            logger.error('LlamaCPP server error:', err)
        })

        llamaServerProc.on('exit', (code) => {
            logger.info(`Llama Server exited with code ${code}`)
            loaded = false
            reject(new Error('Llama Server exited'))
        })
    })
}
