import {defineStore} from 'pinia'

export const useToastStore = defineStore('toast', {
    state: () => {
        return {
            visible: false,
            message: '',
            type: 'error' as 'info' | 'success' | 'error',
            timeout: 3000,
        }
    },
    actions: {
        info(message: string) {
            this.visible = true
            this.message = message
            this.type = 'info'
            setTimeout(() => {
                this.visible = false
            }, this.timeout)
        },
        success(message: string) {
            this.visible = true
            this.message = message
            this.type = 'success'
            setTimeout(() => {
                this.visible = false
            }, this.timeout)
        },
        error(message: string) {
            this.visible = true
            this.message = message
            this.type = 'error'
            setTimeout(() => {
                this.visible = false
            }, this.timeout)
        },
    },
})
