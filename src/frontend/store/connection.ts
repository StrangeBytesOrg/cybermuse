import {defineStore} from 'pinia'

export const useConnectionStore = defineStore('connection', {
    state: () => {
        return {
            connectionUrl: localStorage.getItem('connectionUrl') ?? '',
            connected: false,
        }
    },
    actions: {
        save() {
            localStorage.setItem('connectionUrl', this.connectionUrl)
        },
        async checkConnection() {
            const healthUrl = `${this.connectionUrl}/health`
            const healthResponse = await fetch(healthUrl)
            const healthJson = await healthResponse.json()
            if (healthJson.status === 'ok') {
                this.connected = true
            } else {
                throw new Error('Connection failed')
            }
        },
    },
})
