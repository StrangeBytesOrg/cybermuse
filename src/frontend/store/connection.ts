import {ref} from 'vue'
import {defineStore} from 'pinia'

export const useConnectionStore = defineStore('connection', () => {
    const apiType = ref(localStorage.getItem('apiType') || 'local')
    const apiUrl = ref(localStorage.getItem('apiUrl') || '')
    const connected = ref(false)

    const update = () => {
        localStorage.setItem('apiType', apiType.value)
        localStorage.setItem('apiUrl', apiUrl.value)
    }

    return {apiType, apiUrl, connected, update}
})
