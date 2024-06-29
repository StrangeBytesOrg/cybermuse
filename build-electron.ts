import builder from 'electron-builder'
// import path from 'node:path'
// import {flipFuses, FuseV1Options, FuseVersion} from '@electron/fuses'

// const dev = Boolean(process.env.DEV)

const artifacts = await builder.build({
    // targets: builder.createTargets([builder.Platform.WINDOWS]),
    config: {
        asar: false, // Electron-builder has an issue with folders named "constructor"
        appId: 'chat',
        directories: {
            output: 'out',
        },
        files: [
            //
            'package.json',
            {from: './dist', to: ''},
            {from: './src/migrations/', to: './migrations/'},
        ],
        extraResources: [{from: './llamacpp/LICENSE', to: 'llamacpp/LICENSE'}],
        linux: {
            target: 'dir', // electron-builder uses 7za which is comically slow on linux
            extraResources: [{from: './llamacpp/llama-server', to: 'llamacpp/llama-server'}],
        },
        win: {
            target: [
                // 'zip',
                'nsis',
            ],
            extraResources: [
                {from: './llamacpp/llama-server.exe', to: 'llamacpp/llama-server.exe'},
                {from: './llamacpp/llama.dll', to: 'llamacpp/llama.dll'},
                {from: './llamacpp/ggml.dll', to: 'llamacpp/ggml.dll'},
            ],
        },
        mac: {
            target: [
                {target: 'zip', arch: ['x64']},
                {target: 'zip', arch: ['arm64']},
            ],
            extraResources: [{from: './llamacpp/llama-server', to: 'llamacpp/llama-server'}],
            publish: null,
        },
        artifactName: 'chat-${os}-${arch}.${ext}',
        nsis: {
            oneClick: false,
            runAfterFinish: false,
        },
        // TODO implement fuse flipping correctly for all platforms
        // afterPack: async ({appOutDir, packager}) => {
        //     const {productFilename} = packager.info.appInfo
        //     const appPath = path.join(appOutDir, productFilename)
        //     flipFuses(appPath, {
        //         version: FuseVersion.V1,
        //         [FuseV1Options.RunAsNode]: false,
        //     })
        // },
    },
})

console.log(artifacts)
