import {ref} from 'vue'
import {defineStore} from 'pinia'

type PromptSettings = {
    promptSyntax: string
    systemPrompt: string
}

export const usePromptStore = defineStore('prompt', () => {
    const defaultSettings: PromptSettings = {
        promptSyntax: '',
        systemPrompt: '',
    }

    const promptSettings = ref<PromptSettings>(
        localStorage.getItem('promptSettings') ? JSON.parse(localStorage.getItem('promptSettings')!) : defaultSettings,
    )

    const update = () => {
        localStorage.setItem('promptSettings', JSON.stringify(promptSettings.value))
    }

    return {promptSettings, update}
})
