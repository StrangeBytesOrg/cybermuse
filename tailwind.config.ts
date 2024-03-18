import type {Config} from 'tailwindcss'
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
export default tailwindConfig
