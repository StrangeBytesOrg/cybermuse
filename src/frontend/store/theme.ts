import {defineStore} from 'pinia'

export const useThemeStore = defineStore('theme', {
    state: () => {
        return {
            theme: localStorage.getItem('theme') ?? 'dark',
        }
    },
    actions: {
        save() {
            localStorage.setItem('theme', this.theme)
        },
    },
})
