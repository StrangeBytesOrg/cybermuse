<script lang="ts" setup>
import {useSettingsStore} from '../store'

const settingsStore = useSettingsStore()

const saveSettings = () => {
    settingsStore.update()
}
</script>

<template>
    <div class="flex flex-col p-5">
        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">Temperature</span>
            </div>
            <input type="number" class="input input-bordered" v-model="settingsStore.generationSettings.temperature" />
        </label>

        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">Top P</span>
            </div>
            <input type="number" class="input input-bordered" v-model="settingsStore.generationSettings.topP" />
        </label>

        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">Top K</span>
            </div>
            <input type="number" class="input input-bordered" v-model="settingsStore.generationSettings.topK" />
        </label>

        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">Max Tokens</span>
            </div>
            <input type="number" class="input input-bordered" v-model="settingsStore.generationSettings.maxTokens" />
        </label>

        <button class="btn btn-primary mt-9" @click="saveSettings">Save</button>
    </div>
</template>
