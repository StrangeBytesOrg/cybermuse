import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'

import tailwindConfig from './tailwind.config'

// https://vitejs.dev/config/
export default defineConfig({
    root: './src',
    plugins: [vue()],
    css: {
        postcss: {
            plugins: [tailwind(tailwindConfig), autoprefixer],
        },
    },
})
