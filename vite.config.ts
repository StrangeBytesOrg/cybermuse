import url from 'node:url'
import path from 'node:path'
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwind from 'tailwindcss'
import type {Config} from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import daisyui from 'daisyui'

const tailwindConfig: Config = {
    content: ['./src/**/*'],
    plugins: [daisyui],
    daisyui: {
        themes: true,
        logs: false,
    },
    logs: false,
}

const esmDirname = url.fileURLToPath(new URL('.', import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
    root: './src/frontend/',
    plugins: [vue()],
    base: './',
    css: {
        postcss: {
            plugins: [tailwind(tailwindConfig), autoprefixer],
        },
    },
    build: {
        outDir: path.resolve(esmDirname, 'dist'),
    },
})
