import url from 'node:url'
import path from 'node:path'
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import tailwindConfig from './tailwind.config'

const esmDirname = url.fileURLToPath(new URL('.', import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
    root: './src/frontend/',
    base: './',
    css: {
        postcss: {
            plugins: [tailwind(tailwindConfig), autoprefixer],
        },
    },
    plugins: [vue()],
    build: {
        outDir: path.resolve(esmDirname, 'dist'),
    },
})
