import {ref} from 'vue'
import {defineStore} from 'pinia'

export const useConnectionStore = defineStore('connection', () => {
    const apiUrl = ref(localStorage.getItem('apiUrl') || '')
    const connected = ref(false)

    const save = () => {
        localStorage.setItem('apiUrl', apiUrl.value)
        connected.value = true
    }

    return {apiUrl, connected, save}
})
