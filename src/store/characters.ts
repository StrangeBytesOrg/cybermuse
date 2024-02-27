import {ref} from 'vue'
import {defineStore} from 'pinia'

export const useCharacterStore = defineStore('character', () => {
    type Character = {name: string; description: string}
    const characters = ref<Character[]>(
        localStorage.getItem('characters') ? JSON.parse(localStorage.getItem('characters')!) : [],
    )

    const update = () => {
        localStorage.setItem('characters', JSON.stringify(characters.value))
    }

    return {
        characters,
        update,
    }
})
