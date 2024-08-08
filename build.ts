import esbuild, {BuildOptions} from 'esbuild'
import path from 'node:path'
import fs from 'node:fs/promises'
// import openapiTs from 'openapi-typescript'

const devMode = Boolean(process.env.DEV)

// https://esbuild.github.io/api/
const outputPath = path.resolve(import.meta.dirname, 'dist/backend')
const buildOptions: BuildOptions = {
    platform: 'node',
    format: 'esm',
    bundle: true,
    outdir: outputPath,
    entryPoints: ['./src/backend/electron.ts', './src/backend/server.ts'],
    external: ['electron', 'better-sqlite3', '@fastify/swagger-ui'],
    target: 'esnext',
    inject: ['cjs-shim.ts'],
    sourcemap: devMode,
}

const build = async () => {
    await fs.rm(outputPath, {recursive: true, force: true})
    await esbuild.build(buildOptions)
    console.log('Built backend')
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
