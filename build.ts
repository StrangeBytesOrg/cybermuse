import esbuild, {BuildOptions} from 'esbuild'
import path from 'node:path'
import fs from 'node:fs/promises'

const devMode = Boolean(process.env.DEV)

// https://esbuild.github.io/api/
const outputPath = path.resolve(import.meta.dirname, 'dist/backend')
const buildOptions: BuildOptions = {
    platform: 'node',
    format: 'esm',
    bundle: true,
    outdir: outputPath,
    entryPoints: ['./src/backend/electron.ts', './src/backend/server.ts'],
    external: ['electron', 'node-llama-cpp'],
    target: 'esnext',
    inject: ['cjs-shim.ts'],
    sourcemap: devMode,
}

const build = async () => {
    await fs.rm(outputPath, {recursive: true, force: true})
    await esbuild.build(buildOptions)
    await fs.cp('./src/backend/db/migrations/', './dist/backend/migrations', {recursive: true})
    console.log('Built backend')
}

build()
