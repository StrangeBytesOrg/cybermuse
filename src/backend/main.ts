import path from 'node:path'
import url from 'node:url'
import {app, BrowserWindow} from 'electron'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import {initServer} from '@ts-rest/fastify'
import {generateOpenApi} from '@ts-rest/open-api'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import {contract} from './contract.js'
import {getStatus, generate, loadModel, listModels, setModelDir} from './generate.js'

const serverPort = 31700
const esmDirname = url.fileURLToPath(new URL('.', import.meta.url)) // Works like __dirname

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 800,
        webPreferences: {},
    })

    win.setMenu(null)

    if (app.isPackaged) {
        win.loadFile(path.resolve(esmDirname, '../index.html'))
    } else {
        win.webContents.openDevTools({
            mode: 'bottom', // 'undocked'
        })
        win.loadURL('http://localhost:5173')
    }
}

app.on('ready', createWindow)

const server = Fastify({
    logger: true,
})
server.register(cors)

const s = initServer()
const router = s.router(contract, {
    status: async () => {
        const status = getStatus()
        return {
            status: 200,
            body: status,
        }
    },
    getModels: async () => {
        const models = await listModels()
        return {
            status: 200,
            body: models,
        }
    },
    loadModel: async (req) => {
        const modelName = req.body.modelName
        if (modelName) {
            await loadModel(modelName)
            return {
                status: 200,
                body: {success: true},
            }
        }
    },
    setModelDir: async (req) => {
        const dir = req.body.dir
        if (dir) {
            await setModelDir(dir)
            return {
                status: 200,
                body: {success: true},
            }
        }
    },
    generate: async (req) => {
        const prompt = req.body.prompt
        if (prompt) {
            const wat = await generate(prompt)
            return {
                status: 200,
                body: wat,
            }
        }
    },
})

server.register(s.plugin(router), {
    prefix: '/api',
})

// Generate OpenAPI
const openApiDocument = generateOpenApi(contract, {
    info: {
        title: 'WAT',
        version: '0.1.0',
    },
})
server.register(fastifySwagger, {
    transformObject: () => openApiDocument,
})
server.register(fastifySwaggerUI, {
    prefix: '/docs',
})

server.listen({port: serverPort}, () => {
    console.log(`Server running on port ${serverPort}`)
})
