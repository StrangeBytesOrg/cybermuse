import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import {createViteLicensePlugin} from 'rollup-license-plugin'

export default defineConfig({
    root: path.resolve('./src/frontend/'),
    base: '/',
    plugins: [
        vue(),
        tailwindcss(),
        createViteLicensePlugin(),
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
