<script lang="ts" setup>
import {useSettingsStore} from '@/store'

const settings = useSettingsStore()

const saveSettings = async (event: Event) => {
    const target = event.target as HTMLSelectElement
    settings.setTheme(target.value)
}

const themes = ['dark', 'forest', 'dracula', 'aqua', 'winter', 'pastel']
</script>

<template>
    <fieldset class="p-2">
        <label class="fieldset-label text-sm">Theme</label>
        <select class="select mt-2" @change="saveSettings" :value="settings.theme">
            <option v-for="theme in themes" :value="theme" :key="theme">{{ theme }}</option>
        </select>
    </fieldset>
</template>
