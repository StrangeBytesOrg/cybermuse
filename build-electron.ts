import builder from 'electron-builder'
// import path from 'node:path'
// import {Configuration} from 'electron-builder'
// import {flipFuses, FuseV1Options, FuseVersion} from '@electron/fuses'

const artifacts = await builder.build({
    config: {
        buildNumber: process.env.BUILD_NUMBER || 'manual',
        appId: 'chat-app',
        directories: {
            output: 'out',
        },
        files: [
            'package.json',
            {from: './dist', to: ''},
            {from: './src/migrations/', to: './migrations/'},
            // Remove unnecessary files
            '!**/*.md',
            '!**/*.env',
            '!**/*.bin',
        ],
        linux: {
            target: [{target: 'zip', arch: 'x64'}],
        },
        win: {
            target: ['zip'],
        },
        mac: {
            target: [
                {target: 'zip', arch: ['x64']},
                {target: 'zip', arch: ['arm64']},
            ],
        },
        artifactName: '${productName}-${os}-${arch}-${buildNumber}.${ext}',
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
