import {defineStore} from 'pinia'
import {useToastStore} from '@/store'

const getTokenPayload = (token: string) => {
    const payload = token.split('.')[1]
    if (!payload) throw new Error('Invalid token')
    return JSON.parse(atob(payload))
}

export const useHubStore = defineStore('hub', {
    state: () => {
        return {
            token: localStorage.getItem('hubToken'),
        }
    },
    actions: {
        setToken(token: string) {
            this.token = token
            localStorage.setItem('hubToken', token)
        },
        logout() {
            this.token = ''
            localStorage.removeItem('hubToken')
        },
    },
    getters: {
        authenticated() {
            if (!this.token) return false
            const claim = getTokenPayload(this.token)
            if (claim.exp * 1000 < Date.now()) {
                const toast = useToastStore()
                toast.warn('Hub login expired. Please login again.')
                localStorage.removeItem('hubToken')
                return false
            }
            return true
        },
    },
})
