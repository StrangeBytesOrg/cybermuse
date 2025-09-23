import builder from 'electron-builder'
import fs from 'node:fs'
import path from 'node:path'

const dev = Boolean(process.env.DEV)

const artifacts = await builder.build({
    // targets: builder.createTargets([builder.Platform.WINDOWS]),
    config: {
        productName: 'Cybermuse Desktop',
        appId: 'io.cybermuse.app',
        directories: {
            output: 'build/bin',
        },
        // asar: false,
        files: [
            'package.json',
            {from: './dist', to: ''},
        ],
        artifactName: '${name}-${os}-${arch}.${ext}',
        linux: {
            target: dev ? ['dir'] : ['tar.xz'],
            compression: 'store', // Seems like "normal" actually does max and "store" does normal
        },
        win: {
            target: ['nsis'],
            publish: null, // Prevent publishing to GitHub
        },
        mac: {
            target: [
                {target: 'zip', arch: ['x64']},
                {target: 'zip', arch: ['arm64']},
            ],
            publish: null, // Prevent publishing to GitHub
        },
        nsis: {
            oneClick: false,
            runAfterFinish: false,
        },
        beforePack: async () => {
            console.log('Copying electron.js to dist/')
            fs.copyFileSync(path.resolve('./src/backend/electron.js'), path.resolve('./dist/electron.js'))
        },
        // afterPack: async ({outDir, packager}) => {
        // },
    },
})
console.log(`Built artifacts: \n${artifacts.join('\n')}`)
