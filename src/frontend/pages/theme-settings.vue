<script lang="ts" setup>
import {useThemeStore} from '@/store'

const themeStore = useThemeStore()

const saveSettings = async () => {
    themeStore.save()
}

const themes = ['dark', 'forest', 'dracula', 'aqua', 'winter', 'pastel']
</script>

<template>
    <fieldset class="p-2">
        <label class="fieldset-label text-sm">Theme</label>
        <select class="select mt-2" v-model="themeStore.theme" @change="saveSettings">
            <option v-for="theme in themes" :value="theme" :key="theme">{{ theme }}</option>
        </select>
    </fieldset>
</template>
