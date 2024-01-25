import type {Config} from 'tailwindcss'
import daisyui from 'daisyui'

export default <Partial<Config>>{
    content: ['./pages/**/*.vue', './components/**/*.{js,vue,ts}', './nuxt.config.{js,ts}', './app.vue'],
    plugins: [daisyui],
    daisyui: {
        themes: true,
        logs: false,
    },
}
