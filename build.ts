import esbuild, {BuildOptions} from 'esbuild'
import path from 'node:path'
import url from 'node:url'
import fs from 'node:fs/promises'
import chokidar from 'chokidar'
import electron from 'electron'
import proc from 'node:child_process'
import {createServer} from 'vite'

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

let electronProcess: proc.ChildProcess | null = null

const build = async () => {
    const startTime = performance.now()
    await fs.rm(outputPath, {recursive: true, force: true})
    await esbuild.build(buildOptions)
    const buildTime = performance.now() - startTime
    console.log('Built in', buildTime.toFixed(2) + 'ms')

    console.log('Restarting electron')
    electronProcess?.kill()
    electronProcess = proc.spawn(electronPath, [distMain], {
        stdio: 'inherit',
    })
}

build()

if (devMode) {
    console.log('Starting vite server')
    const server = await createServer({})
    await server.listen()

    console.log(`Watching ${sourceDir}`)
    chokidar.watch(sourceDir).on('change', build)
}
