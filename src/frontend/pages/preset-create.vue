<script lang="ts" setup>
import {reactive} from 'vue'
import {useRouter} from 'vue-router'
import {useToastStore, useSettingsStore} from '@/store'
import {generationPresetCollection} from '@/db'
import NumberInput from '@/components/number-input.vue'

const toast = useToastStore()
const settings = useSettingsStore()
const router = useRouter()
const preset = reactive({
    name: '',
    maxTokens: 250,
    temperature: 1,
    seed: undefined,
    minP: undefined,
    topP: undefined,
    topK: undefined,
    frequencyPenalty: undefined,
    presencePenalty: undefined,
})

const createPreset = async () => {
    const presetId = preset.name.toLowerCase().replace(/ /g, '-')
    await generationPresetCollection.put({
        id: presetId,
        lastUpdate: Date.now(),
        ...preset,
    })
    settings.preset = presetId
    toast.success('Created new preset')
    router.push({name: 'presets'})
}
</script>

<template>
    <div class="flex flex-col bg-base-200 rounded-lg p-3">
        <div class="flex flex-row">
            <fieldset class="fieldset">
                <legend class="fieldset-legend">Basic Settings</legend>

                <label class="fieldset-label text-sm">Preset Name</label>
                <input v-model="preset.name" type="text" class="input" />

                <label class="fieldset-label text-sm">Max Response Tokens</label>
                <NumberInput v-model="preset.maxTokens" class="input" />

                <label class="fieldset-label text-sm">Temperature</label>
                <NumberInput v-model="preset.temperature" class="input" />

                <label class="fieldset-label text-sm">Seed</label>
                <NumberInput v-model="preset.seed" class="input" />

                <label class="fieldset-label text-sm">Min P</label>
                <NumberInput v-model="preset.minP" class="input" />

                <label class="fieldset-label text-sm">Top P</label>
                <NumberInput v-model="preset.topP" class="input" />

                <label class="fieldset-label text-sm">Top K</label>
                <NumberInput v-model="preset.topK" class="input" />

                <label class="fieldset-label text-sm">Frequency-penalty</label>
                <NumberInput v-model="preset.frequencyPenalty" class="input" />

                <label class="fieldset-label text-sm">Presence-penalty</label>
                <NumberInput v-model="preset.presencePenalty" class="input" />
            </fieldset>
        </div>

        <button @click="createPreset" class="btn btn-primary max-w-32 mt-2">Create Preset</button>
    </div>
</template>
