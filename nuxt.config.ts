// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    srcDir: './src',
    devtools: {enabled: true},
    ssr: false,
    modules: ['@nuxtjs/tailwindcss'],
    css: ['@/assets/css/global.css'],
    telemetry: false,
})
