import path from 'node:path'
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import tailwindConfig from './tailwind.config'

// https://vitejs.dev/config/
export default defineConfig({
    root: path.resolve('./src/frontend/'),
    base: './',
    css: {
        postcss: {
            plugins: [tailwind(tailwindConfig), autoprefixer],
        },
    },
    plugins: [vue()],
    build: {
        sourcemap: true,
        outDir: path.resolve(import.meta.dirname, 'dist'),
    },
    server: {
        watch: {
            ignored: ['**/src/server/**/*', '**/openapi.yml'],
        },
    },
})
