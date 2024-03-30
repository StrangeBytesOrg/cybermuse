import esbuild, {BuildOptions} from 'esbuild'
import path from 'node:path'
import url from 'node:url'
import fs from 'node:fs/promises'
import chokidar from 'chokidar'
import electron from 'electron'
import proc from 'node:child_process'
import {createServer} from 'vite'
import tcpPortUsed from 'tcp-port-used'
import openapiTs from 'openapi-typescript'

const esmDirName = url.fileURLToPath(new URL('.', import.meta.url))
const devMode = process.argv.some((argv) => argv === '-d' || argv === '--dev')

const electronPath = electron.toString()
const sourceDir = path.resolve(esmDirName, 'src', 'backend')
const distMain = path.resolve(esmDirName, 'dist', 'backend', 'main.js')
console.log(electronPath)

// https://esbuild.github.io/api/
const outputPath = path.resolve(esmDirName, 'dist/backend')
const buildOptions: BuildOptions = {
    platform: 'node',
    format: 'esm', // Works best with electron
    bundle: false,
    outdir: outputPath,
    entryPoints: ['./src/backend/**/*.ts'],
    target: 'esnext',
    sourcemap: devMode,
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const build = async () => {
    const startTime = performance.now()
    await fs.rm(outputPath, {recursive: true, force: true})
    await esbuild.build(buildOptions)
    const buildTime = performance.now() - startTime
    console.log('Built in', buildTime.toFixed(2) + 'ms')
}

build()

if (devMode) {
    console.log('Starting vite server')
    const server = await createServer({})
    await server.listen()

    console.log('Starting electron')
    let electronProcess = proc.spawn(electronPath, [distMain], {stdio: 'inherit'})

    // Get OpenAPI file from server and update client if it has changed
    await delay(3000) // Give the server a moment to startup
    console.log('Checking spec')
    const res = await fetch('http://localhost:31700/docs/json')
    const openapiSpec = await res.json()
    const ast = await openapiTs(openapiSpec)
    const clientPath = path.resolve(esmDirName, 'src/frontend/api.d.ts')
    const existingClient = await fs.readFile(clientPath, 'utf-8')
    if (existingClient !== ast) {
        console.log('Spec updated, updating client')
        await fs.writeFile(clientPath, ast)
    }

    console.log(`Watching ${sourceDir}`)
    chokidar.watch(sourceDir).on('change', async () => {
        console.log('Restarting electron')
        electronProcess.kill()
        await build()
        await tcpPortUsed.waitUntilFree(31700)
        console.log('Port free')
        electronProcess = proc.spawn(electronPath, [distMain], {stdio: 'inherit'})
    })
}
