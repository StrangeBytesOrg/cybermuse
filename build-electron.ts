import builder from 'electron-builder'
// import path from 'node:path'
// import {Configuration} from 'electron-builder'
// import {flipFuses, FuseV1Options, FuseVersion} from '@electron/fuses'

const dev = Boolean(process.env.DEV)

const artifacts = await builder.build({
    config: {
        // buildNumber: process.env.BUILD_NUMBER || 'manual',
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
        linux: {
            target: dev ? 'dir' : [{target: 'zip', arch: 'x64'}],
            extraResources: [{from: './build/llamacpp/llama-server', to: 'llamacpp/llama-server'}],
        },
        win: {
            target: ['zip'],
            extraResources: [
                {from: './build/llamacpp/llama-server.exe', to: 'llamacpp/llama-server.exe'},
                {from: './build/llamacpp/llama.dll', to: 'llamacpp/llama.dll'},
            ],
        },
        mac: {
            target: [
                {target: 'zip', arch: ['x64']},
                {target: 'zip', arch: ['arm64']},
            ],
            extraResources: [{from: './build/llamacpp/llama-server', to: 'llamacpp/llama-server'}],
        },
        artifactName: 'chat-${os}-${arch}.${ext}',
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
