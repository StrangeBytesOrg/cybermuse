import path from 'node:path'
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import tailwindConfig from './tailwind.config'
import {fileURLToPath} from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
    root: path.resolve('./src/frontend/'),
    base: '/',
    css: {
        postcss: {
            plugins: [tailwind(tailwindConfig), autoprefixer],
        },
    },
    plugins: [vue()],
    build: {
        sourcemap: true,
        outDir: path.resolve(import.meta.dirname, 'dist', 'frontend'),
    },
    server: {
        proxy: {
            '/avatars': 'http://localhost:31700',
            '/trpc': 'http://localhost:31700',
        },
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src/frontend', import.meta.url)),
        },
    },
})
