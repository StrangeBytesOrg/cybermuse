import esbuild, {BuildOptions} from 'esbuild'
import path from 'node:path'
import fs from 'node:fs/promises'
import chokidar from 'chokidar'
import electron from 'electron'
import proc from 'node:child_process'
import {createServer} from 'vite'
// import tcpPortUsed from 'tcp-port-used'
import openapiTs from 'openapi-typescript'

const devMode = process.argv.some((argv) => argv === '-d' || argv === '--dev')

const electronPath = electron.toString()
const sourceDir = path.resolve(import.meta.dirname, 'src', 'backend')
const distMain = path.resolve(import.meta.dirname, 'dist', 'backend', 'main.js')

// https://esbuild.github.io/api/
const outputPath = path.resolve(import.meta.dirname, 'dist/backend')
const buildOptions: BuildOptions = {
    platform: 'node',
    format: 'esm', // Works best with electron
    bundle: false,
    outdir: outputPath,
    entryPoints: ['./src/backend/**/*.ts'],
    target: 'esnext',
    sourcemap: devMode,
}

const build = async () => {
    const startTime = performance.now()
    await fs.rm(outputPath, {recursive: true, force: true})
    await esbuild.build(buildOptions)
    const buildTime = performance.now() - startTime
    console.log('Built in', buildTime.toFixed(2) + 'ms')
}

// const updateOpenAPI = async () => {
//     console.log('Checking OpenAPI spec')
//     const res = await fetch('http://localhost:31700/docs/json')
//     const spec = await res.json()
//     const ast = await openapiTs(spec, {})
//     const clientPath = path.resolve(esmDirName, 'src/frontend/api.d.ts')
//     const existingClient = await fs.readFile(clientPath, 'utf-8')
//     if (existingClient !== ast) {
//         console.log('Spec updated, updating client')
//         await fs.writeFile(clientPath, ast)
//     }
// }

build()

// if (devMode) {
//     console.log('Starting vite server')
//     const server = await createServer({
//         server: {
//             host: '0.0.0.0',
//         },
//     })
//     await server.listen()

//     console.log('Starting electron')
//     let electronProcess = proc.spawn(electronPath, [distMain], {stdio: 'inherit'})

//     // Update OpenAPI client
//     await tcpPortUsed.waitUntilUsed(31700, 500, 5_000)
//     await updateOpenAPI()

//     console.log(`Watching ${sourceDir}`)
//     chokidar.watch(sourceDir).on('change', async () => {
//         console.log('Restarting electron')
//         electronProcess.kill()
//         await build()
//         await tcpPortUsed.waitUntilFree(31700)
//         console.log('Port free')
//         electronProcess = proc.spawn(electronPath, [distMain], {stdio: 'inherit'})

//         // Update OpenAPI client
//         await tcpPortUsed.waitUntilUsed(31700)
//         await updateOpenAPI()
//         server.restart()
//     })
// }
