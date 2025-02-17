import {defineStore} from 'pinia'

export const useMenuStore = defineStore('menu', {
    state: () => {
        return {
            visible: false,
        }
    },
    actions: {
        toggle() {
            this.visible = !this.visible
        },
    },
})
