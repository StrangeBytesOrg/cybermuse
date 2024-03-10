import type {Config} from 'tailwindcss'
import daisyui from 'daisyui'

export default {
    content: ['./src/**/*'],
    plugins: [daisyui],
    daisyui: {
        themes: true,
        logs: false,
    },
    logs: false,
} as Config
