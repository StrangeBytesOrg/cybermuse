<script lang="ts" setup>
import {ref} from 'vue'
import {useSettingsStore} from '../store'

const settingsStore = useSettingsStore()
const promptTemplate = ref('')

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

        <label class="form-control w-full">
            <div class="label">
                <span class="label-text">Prompt Syntax</span>
            </div>
            <textarea class="textarea textarea-bordered" v-model="promptTemplate" />
        </label>

        <button class="btn btn-primary mt-9" @click="saveSettings">Save</button>
    </div>
</template>
