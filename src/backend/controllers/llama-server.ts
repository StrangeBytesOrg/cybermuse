import fs from 'node:fs'
import path from 'node:path'
import {Elysia, t} from 'elysia'
import {type ChildProcessWithoutNullStreams, spawn} from 'node:child_process'
import {getConfig, setConfig} from '../config.js'

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

export const llamaServerRoutes = new Elysia()

llamaServerRoutes.get(
    '/status',
    async () => {
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
    {
        tags: ['llama-server'],
        detail: {
            operationId: 'GetLlamaServerStatus',
            summary: 'Get status info about the server',
        },
        response: {
            200: t.Object({
                loaded: t.Boolean(),
                currentModel: t.String(),
                modelPath: t.String(),
                autoLoad: t.Boolean(),
                useGPU: t.Boolean(),
                contextSize: t.Number(),
            }),
        },
    },
)

llamaServerRoutes.post(
    '/start-server',
    async ({body}) => {
        const {modelFile, contextSize, useGPU} = body
        await startLlamaServer(modelFile, contextSize, useGPU)
        return {success: true}
    },
    {
        tags: ['llama-server'],
        detail: {
            operationId: 'StartLlamaServer',
            summary: 'Startup the llama server',
        },
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
)

llamaServerRoutes.post(
    '/stop-server',
    async () => {
        llamaServerProc.on('exit', (code) => {
            console.log(`Llama Server exited with code ${code}`)
            loaded = false
            currentModel = ''
            return {success: true}
        })
        llamaServerProc.kill()
    },
    {
        tags: ['llama-server'],
        detail: {
            operationId: 'StopLlamaServer',
            summary: 'Stop the llama server',
        },
    },
)

export const startLlamaServer = async (modelName: string, contextSize: number, useGPU: boolean) => {
    let serverBinPath: string
    if (import.meta.dirname.includes('$bunfs') || import.meta.dirname.includes('~BUN')) {
        serverBinPath = path.resolve(path.dirname(process.execPath), './llamacpp/llama-server')
    } else {
        serverBinPath = path.resolve(import.meta.dirname, '../../../llamacpp/llama-server')
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
