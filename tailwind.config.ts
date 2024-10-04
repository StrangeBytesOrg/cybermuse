import type {Config} from 'tailwindcss'
import daisyui from 'daisyui'
import themes from 'daisyui/src/theming/themes'

const tailwindConfig: Config = {
    content: ['./src/frontend/**/*.{html,ts,vue}'],
    plugins: [daisyui],
    daisyui: {
        // themes: true,
        themes: [
            {
                dark: {
                    ...themes.dark,
                    '--msg': '#ffffff',
                    '--quote': 'oklch(0.79 0.17 70)',
                },
                forest: {
                    ...themes.forest,
                    '--msg': '#ffffff',
                    '--quote': 'oklch(var(--p))',
                    '--rounded-btn': '0.5rem',
                    '--rounded-box': '0.5rem',
                },
                dracula: {
                    ...themes.dracula,
                    '--msg': '#ffffff',
                    '--quote': 'oklch(var(--p))',
                },
                aqua: {
                    ...themes.aqua,
                    '--msg': '#ffffff',
                    '--quote': 'oklch(0.79 0.17 70.66)',
                },
                winter: {
                    ...themes.winter,
                    '--msg': '#000',
                    '--quote': 'oklch(0.79 0.17 70.66)',
                },
                pastel: {
                    ...themes.pastel,
                    '--msg': '#000',
                    '--quote': 'oklch(0.6, 0.3, 310)',
                    '--rounded-btn': '0.5rem',
                    '--rounded-box': '0.5rem',
                },
            },
        ],
        logs: false,
    },
    logs: false,
}
export default tailwindConfig
