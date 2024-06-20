import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import type {ZodTypeProvider} from 'fastify-type-provider-zod'
import type {FastifyPluginAsync} from 'fastify'
import {z} from 'zod'
import {type ChildProcessWithoutNullStreams, spawn} from 'node:child_process'
import {getConfig, setConfig} from '../config.js'

const esmDirname = url.fileURLToPath(new URL('.', import.meta.url)) // Works like __dirname
let llamaServerProc: ChildProcessWithoutNullStreams
let loaded = false
let currentModel: string = ''

// Cleanup subprocess on exit
process.on('exit', () => {
    if (llamaServerProc) {
        console.log('Killing llama server')
        llamaServerProc.kill('SIGKILL')
    }
})

export const llamaServerRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/status',
        method: 'GET',
        schema: {
            summary: 'Get status info about the server',
            response: {
                200: z.object({
                    currentModel: z.string(),
                    modelPath: z.string().optional(),
                    autoLoad: z.boolean(),
                    loaded: z.boolean(),
                    useGPU: z.boolean(),
                    contextSize: z.number(),
                }),
            },
        },
        handler: async () => {
            const config = getConfig()
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

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/start-server',
        method: 'POST',
        schema: {
            summary: 'Load a model',
            body: z.object({
                modelFile: z.string(),
                contextSize: z.number(),
                useGPU: z.boolean(),
            }),
            response: {
                200: z.object({
                    success: z.boolean(),
                }),
            },
        },
        handler: async (req) => {
            const {modelFile, contextSize, useGPU} = req.body
            await startLlamaServer(modelFile, contextSize, useGPU)
            return {success: true}
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/stop-server',
        method: 'POST',
        schema: {
            summary: 'Stop the llama server',
        },
        handler: async () => {
            llamaServerProc.on('exit', (code) => {
                console.log(`Llama Server exited with code ${code}`)
                loaded = false
                currentModel = ''
                return {success: true}
            })
            llamaServerProc.kill()
        },
    })
}

export const startLlamaServer = async (modelName: string, contextSize: number, useGPU: boolean) => {
    // Run llama.cpp server
    let serverBinPath = path.resolve(esmDirname, '../../../llamacpp/llama-server')
    if (process.env.DEV) {
        serverBinPath = path.resolve(esmDirname, '../../../llamacpp/llama-server')
    }
    if (process.platform === 'win32') {
        serverBinPath += '.exe'
    }
    console.log(`Server bin path: ${serverBinPath}`)
    if (!fs.existsSync(serverBinPath)) {
        throw new Error('LlamaCPP Server binary not found')
    }

    const config = getConfig()
    const modelPath = path.resolve(config.modelsPath, modelName)
    console.log(modelPath)
    if (!fs.existsSync(modelPath)) {
        throw new Error('Model file not found')
    }

    return new Promise((resolve, reject) => {
        const args = ['-m', modelPath]
        args.push('--ctx-size', String(contextSize))
        if (useGPU) {
            args.push('--gpu-layers', '128')
        }
        llamaServerProc = spawn(serverBinPath, args, {})
        llamaServerProc.stdout.on('data', (data) => {
            const output: string = data.toString()
            console.log(`Stdout: ${output}`)
            if (output.includes('HTTP server listening')) {
                console.log('Server actually started')
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
            console.error(`Stderr: ${output}`)
            if (output.includes('error')) {
                reject(new Error(output))
            }
        })

        llamaServerProc.on('error', (err) => {
            console.error('server error:', err)
        })
    })
}
