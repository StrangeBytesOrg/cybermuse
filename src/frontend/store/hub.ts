import {defineStore} from 'pinia'

export const useHubStore = defineStore('hub', {
    state: () => {
        return {
            token: localStorage.getItem('hubToken'),
            authenticated: false,
        }
    },
    actions: {
        setToken(token: string) {
            this.token = token
            localStorage.setItem('hubToken', token)
        },
        clearToken() {
            this.token = ''
            localStorage.removeItem('hubToken')
        },
    },
})
