import {ref} from 'vue'
import {defineStore} from 'pinia'

export const useThemeStore = defineStore('theme', () => {
    const theme = ref<string>(localStorage.getItem('theme') ? localStorage.getItem('theme')! : 'dark')

    const update = () => {
        localStorage.setItem('theme', theme.value)
    }

    return {theme, update}
})
