import {ref} from 'vue'
import {defineStore} from 'pinia'

const defaultApiUrl = 'http://localhost:31700'

export const useConnectionStore = defineStore('connection', () => {
    const apiUrl = ref(localStorage.getItem('apiUrl') || defaultApiUrl)
    const connected = ref(false)

    const update = () => {
        localStorage.setItem('apiUrl', apiUrl.value)
    }

    return {apiUrl, connected, update}
})
