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
                    useGPU: t.Boolean(),
                    contextSize: t.Number(),
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
                useGPU: config.useGPU,
                contextSize: config.contextSize,
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
                useGPU: t.Boolean(),
            }),
            response: {
                200: t.Object({
                    success: t.Boolean(),
                }),
            },
        },
        handler: async (req) => {
            const {modelFile, contextSize, useGPU} = req.body
            await startLlamaServer(modelFile, contextSize, useGPU)
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

export const startLlamaServer = async (modelName: string, contextSize: number, useGPU: boolean) => {
    // Run llama.cpp server
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
    if (!fs.existsSync(modelPath)) {
        throw new Error('Model file not found')
    }

    return new Promise((resolve, reject) => {
        const args = ['-m', modelPath]
        args.push('--ctx-size', String(contextSize))
        args.push('--log-disable') // Prevent creating a llama.log file
        if (useGPU) {
            args.push('--gpu-layers', '128')
        }
        llamaServerProc = spawn(serverBinPath, args, {})
        llamaServerProc.stdout.on('data', (data) => {
            const output: string = data.toString()
            process.stdout.write(chalk.cyan(output))
            if (output.includes('HTTP server listening')) {
                logger.info('Detected server startup')
                loaded = true
                currentModel = modelName
                config.contextSize = contextSize
                config.useGPU = useGPU
                config.lastModel = modelName
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
