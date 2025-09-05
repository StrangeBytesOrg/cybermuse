import {defineStore} from 'pinia'

export const useSettingsStore = defineStore('settings', {
    state: () => {
        return {
            theme: 'dark',
            preset: 'default-generation-preset',
            template: 'default-template',
            syncProvider: '',
            syncServer: '',
            syncSecret: '',
            generationProvider: '',
            generationServer: '',
            generationModel: '',
            generationKey: '',
            providerOptions: '',
        }
    },
    persist: true,
})
