import {defineStore} from 'pinia'

export const useSettingsStore = defineStore('settings', {
    state: () => {
        return {
            theme: localStorage.getItem('theme') ?? 'dark',
            preset: localStorage.getItem('preset') ?? 'default-generation-preset',
            template: localStorage.getItem('template') ?? 'default-template',
            syncProvider: localStorage.getItem('syncProvider'),
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
    },
})
