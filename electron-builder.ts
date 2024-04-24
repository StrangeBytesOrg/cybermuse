import path from 'node:path'
import {Configuration} from 'electron-builder'
import {flipFuses, FuseV1Options, FuseVersion} from '@electron/fuses'

const config: Configuration = {
    appId: 'chat-app',
    asar: true,
    directories: {
        output: 'out',
    },
    files: [
        'package.json',
        {
            from: './dist',
            to: './',
        },
        {
            from: './src/migrations/',
            to: './migrations/',
        },
        // Remove unnecessary files
        '!**/*.md',
        '!**/*.env', // Are .env files ever necessary inside of node_modules? Hopefully not.
        '!**/*.bin',
    ],
    linux: {
        target: ['dir'],
    },
    win: {
        target: ['dir'],
    },
    afterPack: async ({appOutDir, packager}) => {
        const {productFilename} = packager.info.appInfo
        const appPath = path.join(appOutDir, productFilename)
        flipFuses(appPath, {
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
        })
    },
}

export default config
