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

    <div class="p-2">
        <label class="form-control w-full max-w-36">
            <div class="label">
                <span class="label-text">Theme</span>
            </div>
            <select class="select select-bordered" v-model="themeStore.theme" @change="saveSettings">
                <option v-for="theme in themes" :value="theme" :key="theme">{{ theme }}</option>
            </select>
        </label>
    </div>
</template>
