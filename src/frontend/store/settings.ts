import {defineStore} from 'pinia'

export const useSettingsStore = defineStore('settings', {
    state: () => {
        return {
            theme: localStorage.getItem('theme') ?? 'dark',
            preset: localStorage.getItem('preset') ?? 'default-generation-preset',
            template: localStorage.getItem('template') ?? 'default-template',
            syncProvider: localStorage.getItem('syncProvider'),
            syncServer: localStorage.getItem('syncServer'),
            syncSecret: localStorage.getItem('syncSecret'),
            generationProvider: localStorage.getItem('generationProvider'),
            generationServer: localStorage.getItem('generationServer') ?? '',
            generationModel: localStorage.getItem('generationModel'),
            generationKey: localStorage.getItem('generationKey'),
        }
    },
    actions: {
        setTheme(theme: string) {
            this.theme = theme
            localStorage.setItem('theme', theme)
        },
        setPreset(preset: string) {
            this.preset = preset
            localStorage.setItem('preset', preset)
        },
        setTemplate(template: string) {
            this.template = template
            localStorage.setItem('template', template)
        },
        setSyncProvider(syncProvider: string) {
            this.syncProvider = syncProvider
            localStorage.setItem('syncProvider', syncProvider)
        },
        setSyncServer(syncServer: string) {
            this.syncServer = syncServer
            localStorage.setItem('syncServer', syncServer)
        },
        setSyncSecret(syncSecret: string) {
            this.syncSecret = syncSecret
            localStorage.setItem('syncSecret', syncSecret)
        },
        setGenerationProvider(generationProvider: string) {
            this.generationProvider = generationProvider
            localStorage.setItem('generationProvider', generationProvider)
        },
        setGenerationServer(generationServer: string) {
            this.generationServer = generationServer
            localStorage.setItem('generationServer', generationServer)
        },
        setGenerationKey(generationKey: string) {
            this.generationKey = generationKey
            localStorage.setItem('generationKey', generationKey)
        },
        setGenerationModel(generationModel: string) {
            this.generationModel = generationModel
            localStorage.setItem('generationModel', generationModel)
        },
    },
})
