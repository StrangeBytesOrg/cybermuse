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
    },
})
