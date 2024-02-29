import {ref} from 'vue'
import {defineStore} from 'pinia'

export const useConnectionStore = defineStore('connection', () => {
    const apiUrl = ref(localStorage.getItem('apiUrl') || '')
    const connected = ref(false)

    const update = () => {
        localStorage.setItem('apiUrl', apiUrl.value)
    }

    return {apiUrl, connected, update}
})
