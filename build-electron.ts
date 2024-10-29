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
        // asar: false,
        files: [
            'package.json',
            {from: './dist', to: ''},
            '!node_modules/node-llama-cpp/bins/**/*',
            'node_modules/node-llama-cpp/bins/${os}-${arch}*/**/*',
            '!node_modules/@node-llama-cpp/*/bins/**/*',
            'node_modules/@node-llama-cpp/${os}-${arch}*/bins/**/*',
            '!node_modules/node-llama-cpp/llama/localBuilds/**/*',
            'node_modules/node-llama-cpp/llama/localBuilds/${os}-${arch}*/**/*',
        ],
        asarUnpack: [
            '**/node_modules/sharp/**/*',
            '**/node_modules/@img/**/*',
            'node_modules/node-llama-cpp/bins',
            'node_modules/node-llama-cpp/llama/localBuilds',
            'node_modules/@node-llama-cpp/*',
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
        // afterPack: async ({outDir, packager}) => {
        // },
    },
})
console.log(`Built artifacts: \n${artifacts.join('\n')}`)
