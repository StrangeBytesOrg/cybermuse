<script lang="ts" setup>
import {useThemeStore} from '../store'

const themeStore = useThemeStore()

const saveSettings = async () => {
    themeStore.update()
}

const themes = [
    'dark',
    'business',
    'light',
    'synthwave',
    'retro',
    'valentine',
    'halloween',
    'forest',
    'aqua',
    'lofi',
    'pastel',
    'luxury',
    'dracula',
    'night',
    'coffee',
    'sunset',
]
</script>

<template>
    <div class="p-2">
        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">Theme</span>
            </div>
            <select class="select select-bordered" v-model="themeStore.theme">
                <option v-for="theme in themes" :value="theme" :key="theme">{{ theme }}</option>
            </select>
        </label>

        <button class="btn btn-primary mt-4" @click="saveSettings">Save</button>
    </div>
</template>
