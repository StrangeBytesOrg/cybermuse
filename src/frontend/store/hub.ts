import {defineStore} from 'pinia'
import {useToastStore} from './toast'
import {createHubClient} from '@/clients/hub-client'

export const useHubStore = defineStore('hub', {
    state: () => {
        return {
            token: localStorage.getItem('hubToken'),
        }
    },
    getters: {
        authenticatedClient: (state) => createHubClient(state.token),
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
            await this.authenticatedClient.POST('/logout')
            this.removeToken()
        },
        async checkAuth() {
            if (!this.token) return false
            const {response} = await this.authenticatedClient.GET('/verify_token')
            if (response.status === 401) {
                useToastStore().warn('Hub login expired. Please login again.')
                this.removeToken()
            }
        },
    },
})
