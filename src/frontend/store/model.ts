import {defineStore} from 'pinia'
import {client} from '@/api-client'

export const useModelStore = defineStore('model', {
    state: () => {
        return {loaded: false}
    },
    actions: {
        async getLoaded() {
            const {loaded} = await client.llamaCpp.status.query()
            this.loaded = loaded
        },
    },
})
