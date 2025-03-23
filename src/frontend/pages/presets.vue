<script lang="ts" setup>
import {computed} from 'vue'
import {useToastStore, useSettingsStore} from '@/store'
import {generationPresetCollection} from '@/db'
import NumberInput from '@/components/number-input.vue'

const toast = useToastStore()
const settings = useSettingsStore()
const presets = await generationPresetCollection.toArray()

const activePreset = computed(() => {
    return presets.find((preset) => preset.id === settings.preset)
})

const setActivePreset = async (event: Event) => {
    const target = event.target as HTMLSelectElement
    settings.setPreset(target.value)
    toast.success('Active preset set')
}

const updatePreset = async () => {
    if (activePreset.value) {
        await generationPresetCollection.put(activePreset.value)
        toast.success('Preset updated')
    }
}

const deletePreset = async () => {
    if (activePreset.value?.id === 'default-generation-preset') {
        throw new Error('Cannot delete the default preset')
    }

    if (activePreset.value) {
        await generationPresetCollection.delete(activePreset.value.id)
        settings.setPreset('default-generation-preset')
        toast.success('Preset deleted')
    }
}
</script>

<template>
    <div class="flex flex-row">
        <div class="flex flex-col">
            <select @change="setActivePreset" :value="activePreset?.id" class="select min-w-60">
                <option v-for="preset in presets" :key="preset.id" :value="preset.id">
                    {{ preset.name }}
                </option>
            </select>
        </div>

        <router-link to="/create-preset" class="btn btn-primary mt-auto ml-3">Create Preset</router-link>
    </div>

    <div v-if="activePreset" class="flex flex-col justify-between bg-base-200 rounded-lg p-3 pt-1 mt-3">
        <div class="flex flex-row">
            <fieldset class="fieldset">
                <legend class="fieldset-legend">Basic Settings</legend>

                <label class="fieldset-label text-sm">Preset Name</label>
                <input v-model="activePreset.name" type="text" class="input" />

                <label class="fieldset-label text-sm">Max Response Tokens</label>
                <NumberInput v-model="activePreset.maxTokens" class="input" />

                <label class="fieldset-label text-sm">Temperature</label>
                <NumberInput v-model="activePreset.temperature" class="input" />

                <label class="fieldset-label text-sm">Seed</label>
                <NumberInput v-model="activePreset.seed" class="input" />

                <label class="fieldset-label text-sm">Min P</label>
                <NumberInput v-model="activePreset.minP" class="input" />

                <label class="fieldset-label text-sm">Top P</label>
                <NumberInput v-model="activePreset.topP" class="input" />

                <label class="fieldset-label text-sm">Top K</label>
                <NumberInput v-model="activePreset.topK" class="input" />
            </fieldset>

            <fieldset class="fieldset ml-5">
                <legend class="fieldset-legend">Penalties</legend>

                <label class="fieldset-label text-sm">Repeat-penalty</label>
                <NumberInput
                    v-model="activePreset.repeatPenalty.penalty"
                    class="input"
                />

                <label class="fieldset-label text-sm">Presence-penalty</label>
                <NumberInput
                    v-model="activePreset.repeatPenalty.presencePenalty"
                    class="input"
                />

                <label class="fieldset-label text-sm">Frequency-penalty</label>
                <NumberInput
                    v-model="activePreset.repeatPenalty.frequencyPenalty"
                    class="input"
                />

                <label class="fieldset-label text-sm">Last Tokens</label>
                <NumberInput
                    v-model="activePreset.repeatPenalty.lastTokens"
                    class="input"
                />

                <label class="fieldset-label text-sm">Penalize-nl</label>
                <select v-model="activePreset.repeatPenalty.penalizeNewLine" class="select">
                    <option :value="true">true</option>
                    <option :value="false">false</option>
                </select>
            </fieldset>
        </div>

        <div class="flex flex-row space-x-2 mt-5">
            <button @click="updatePreset" class="btn btn-primary">Save</button>
            <button @click="deletePreset" class="btn btn-error">Delete</button>
        </div>
    </div>
    <div v-else>Preset not found</div>
</template>
