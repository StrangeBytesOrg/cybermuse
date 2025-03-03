import path from 'node:path'
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import {createViteLicensePlugin} from 'rollup-license-plugin'
import {fileURLToPath} from 'node:url'

export default defineConfig({
    root: path.resolve('./src/frontend/'),
    base: '/',
    plugins: [
        vue(),
        tailwindcss(),
        createViteLicensePlugin({
            additionalFiles: {
                'acknowledgements.md': (packages) => {
                    let licenses = ''
                    packages.forEach((pkg) => {
                        licenses += `## ${pkg.name} (${pkg.license})\n`
                        licenses += `${pkg.licenseText.split('\n').map(line => `> ${line}`).join('\n')}\n\n`
                    })
                    return licenses
                },
            },
        }),
    ],
    build: {
        sourcemap: true,
        outDir: path.resolve(import.meta.dirname, 'dist'),
        emptyOutDir: true,
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src/frontend', import.meta.url)),
        },
    },
})
