import {ref} from 'vue'
import {defineStore} from 'pinia'

type Character = {name: string; description: string}

export const useCharacterStore = defineStore('character', () => {
    const characters = ref<Map<string, Character>>(
        localStorage.getItem('characters') ? JSON.parse(localStorage.getItem('characters')!) : new Map(),
    )

    const update = () => {
        localStorage.setItem('characters', JSON.stringify(characters.value))
    }

    return {
        characters,
        update,
    }
})
