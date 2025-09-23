import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import {createViteLicensePlugin} from 'rollup-license-plugin'

export default defineConfig({
    root: path.resolve('./src/frontend/'),
    base: '',
    plugins: [
        vue(),
        tailwindcss(),
        createViteLicensePlugin(),
    ],
    build: {
        sourcemap: true,
        outDir: path.resolve(import.meta.dirname, 'dist'),
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // Create a vendor chunk
                    if (id.includes('node_modules')) {
                        return 'vendor'
                    }
                },
                // Clean up chunk file names
                chunkFileNames: (chunkInfo) => {
                    if (chunkInfo.name.includes('vue_vue_type_script_setup_true_lang')) {
                        return 'assets/component-[hash].js'
                    }
                    return 'assets/[name]-[hash].js'
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src/frontend', import.meta.url)),
        },
    },
})
