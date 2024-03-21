import esbuild, {BuildOptions} from 'esbuild'
import path from 'node:path'
import url from 'node:url'
import fs from 'node:fs/promises'

const esmDirName = url.fileURLToPath(new URL('.', import.meta.url))
const watch = process.argv.some((argv) => argv === '-d' || argv === '--dev')

// https://esbuild.github.io/api/
const outputPath = path.resolve(esmDirName, 'dist/backend')
const buildOptions: BuildOptions = {
    platform: 'node',
    format: 'esm', // Works best with electron
    bundle: false,
    outdir: outputPath,
    entryPoints: ['./src/backend/**/*.ts'],
    target: 'esnext',
}

const build = async () => {
    // Empty output directory first
    await fs.rm(outputPath, {recursive: true, force: true})

    if (watch) {
        const buildContext = await esbuild.context({
            ...buildOptions,
            color: true,
            sourcemap: true,
        })
        await buildContext.watch()
        console.log('ESBuild watching')
    } else {
        const startTime = performance.now()
        await esbuild.build(buildOptions)
        const buildTime = performance.now() - startTime
        console.log('Built in', buildTime.toFixed(2) + 'ms')
    }
}
build()
