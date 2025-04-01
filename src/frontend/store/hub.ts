import {defineStore} from 'pinia'
import {useToastStore} from '@/store'
import hubClient from '@/clients/hub-client'

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
        removeToken() {
            this.token = null
            localStorage.removeItem('hubToken')
        },
        async logout() {
            await hubClient.POST('/logout', {
                params: {header: {authorization: `Bearer ${this.token}`}},
            })
            this.removeToken()
        },
        async checkAuth() {
            if (!this.token) return false
            const {response} = await hubClient.GET('/verify_token', {
                params: {header: {authorization: `Bearer ${this.token}`}},
            })
            if (response.status === 401) {
                useToastStore().warn('Hub login expired. Please login again.')
                this.removeToken()
            }
        },
    },
})
