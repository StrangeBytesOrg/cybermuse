import builder from 'electron-builder'

const dev = Boolean(process.env.DEV)

const artifacts = await builder.build({
    // targets: builder.createTargets([builder.Platform.WINDOWS]),
    config: {
        productName: 'Cybermuse Desktop',
        appId: 'io.cybermuse.app',
        directories: {
            output: 'out',
        },
        asar: false, // Electron-builder has an issue with folders named "constructor"
        files: [
            //
            'package.json',
            {from: './dist', to: ''},
            {from: './src/migrations/', to: './migrations/'},
        ],
        extraResources: [{from: './llamacpp/LICENSE', to: 'llamacpp/LICENSE'}],
        artifactName: '${name}-${os}-${arch}.${ext}',
        linux: {
            target: dev ? ['dir'] : ['tar.xz'],
            extraResources: [{from: './llamacpp/llama-server', to: 'llamacpp/llama-server'}],
            compression: 'store', // Seems like "normal" actually does max and "store" does normal
        },
        win: {
            target: ['nsis'],
            extraResources: [
                {from: './llamacpp/llama-server.exe', to: 'llamacpp/llama-server.exe'},
                {from: './llamacpp/llama.dll', to: 'llamacpp/llama.dll'},
                {from: './llamacpp/ggml.dll', to: 'llamacpp/ggml.dll'},
            ],
            publish: null, // Prevent publishing to GitHub
        },
        mac: {
            target: [
                {target: 'zip', arch: ['x64']},
                {target: 'zip', arch: ['arm64']},
            ],
            extraResources: [{from: './llamacpp/llama-server', to: 'llamacpp/llama-server'}],
            publish: null, // Prevent publishing to GitHub
        },
        nsis: {
            oneClick: false,
            runAfterFinish: false,
        },
        // afterPack: async ({outDir, packager}) => {
        // },
    },
})
console.log(`Built artifacts: \n${artifacts.join('\n')}`)
