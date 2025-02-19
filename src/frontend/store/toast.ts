import {defineStore} from 'pinia'

type Toast = {
    message: string
    type: 'alert-info' | 'alert-success' | 'alert-error'
}

export const useToastStore = defineStore('toast', {
    state: () => {
        return {
            toasts: new Map() as Map<number, Toast>,
        }
    },
    actions: {
        info(message: string, timeout: number = 3000) {
            const id = Math.random()
            this.toasts.set(id, {message, type: 'alert-info'})
            setTimeout(() => {
                this.toasts.delete(id)
            }, timeout)
        },
        success(message: string, timeout: number = 3000) {
            const id = Math.random()
            this.toasts.set(id, {message, type: 'alert-success'})
            setTimeout(() => {
                this.toasts.delete(id)
            }, timeout)
        },
        error(message: string, timeout: number = 3000) {
            const id = Math.random()
            this.toasts.set(id, {message, type: 'alert-error'})
            setTimeout(() => {
                this.toasts.delete(id)
            }, timeout)
        },
    },
})
