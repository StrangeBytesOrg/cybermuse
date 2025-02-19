import path from 'node:path'
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import {fileURLToPath} from 'node:url'

export default defineConfig({
    root: path.resolve('./src/frontend/'),
    base: '/',
    plugins: [vue(), tailwindcss()],
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
