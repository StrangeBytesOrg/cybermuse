import {defineStore} from 'pinia'

export const useConnectionStore = defineStore('connection', {
    state: () => {
        return {
            connectionProvider: localStorage.getItem('connectionProvider') ?? '',
            connectionUrl: localStorage.getItem('connectionUrl') ?? '',
            connected: false,
        }
    },
    actions: {
        save() {
            localStorage.setItem('connectionUrl', this.connectionUrl)
            localStorage.setItem('connectionProvider', this.connectionProvider)
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
