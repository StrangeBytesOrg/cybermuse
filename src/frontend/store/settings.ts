import {ref} from 'vue'
import {defineStore} from 'pinia'

type GenerationSettings = {temperature: number; topK?: number; topP?: number; maxTokens?: number}

export const useSettingsStore = defineStore('settings', () => {
    const defaultSettings: GenerationSettings = {
        temperature: 1,
        topK: 40,
        topP: 0.9,
        maxTokens: 150,
    }
    const generationSettings = ref<GenerationSettings>(
        localStorage.getItem('generationSettings')
            ? JSON.parse(localStorage.getItem('generationSettings')!)
            : defaultSettings,
    )

    const update = () => {
        localStorage.setItem('generationSettings', JSON.stringify(generationSettings.value))
    }

    return {generationSettings, update}
})
