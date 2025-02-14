<script lang="ts" setup>
import {useThemeStore} from '@/store'
import TopBar from '@/components/top-bar.vue'

const themeStore = useThemeStore()

const saveSettings = async () => {
    themeStore.save()
}

const themes = ['dark', 'forest', 'dracula', 'aqua', 'winter', 'pastel']
</script>

<template>
    <TopBar title="Theme Settings" />

    <fieldset class="p-2">
        <label class="fieldset-label text-sm">Theme</label>
        <select class="select select-bordered mt-2" v-model="themeStore.theme" @change="saveSettings">
            <option v-for="theme in themes" :value="theme" :key="theme">{{ theme }}</option>
        </select>
    </fieldset>
</template>
