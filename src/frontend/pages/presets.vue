<script lang="ts" setup>
import {computed, ref, reactive} from 'vue'
import {useToastStore, useSettingsStore} from '@/store'
import {generationPresetCollection} from '@/db'
import NumberInput from '@/components/number-input.vue'

const toast = useToastStore()
const settings = useSettingsStore()
let presets = reactive(await generationPresetCollection.toArray())
const createMode = ref(false)
const newPreset = reactive({
    name: '',
    maxTokens: undefined,
    temperature: undefined,
    seed: undefined,
    minP: undefined,
    topP: undefined,
    topK: undefined,
    frequencyPenalty: undefined,
    presencePenalty: undefined,
})

const activePreset = computed(() => {
    return presets.find((preset) => preset.id === settings.preset)
})

const currentPreset = computed(() => {
    return createMode.value ? newPreset : activePreset.value
})

const setActivePreset = async (event: Event) => {
    const target = event.target as HTMLSelectElement
    settings.preset = target.value
    toast.success('Active preset set')
}

const createPreset = async () => {
    const id = await generationPresetCollection.put(newPreset)
    presets = reactive(await generationPresetCollection.toArray())
    settings.preset = id
    createMode.value = false
    toast.success('Created new preset')
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
        presets = reactive(await generationPresetCollection.toArray())
        settings.preset = 'default-generation-preset'
        toast.success('Preset deleted')
    }
}
</script>

<template>
    <div class="flex flex-row gap-x-2 px-1 md:px-0 max-w-lg">
        <select @change="setActivePreset" :value="activePreset?.id" class="select flex-1 flex-grow">
            <option v-for="preset in presets" :key="preset.id" :value="preset.id">
                {{ preset.name }}
            </option>
        </select>

        <button @click="createMode = !createMode" :class="['btn', createMode ? 'btn-primary' : 'btn-success']">
            {{ createMode ? 'Cancel' : '+ Create Preset' }}
        </button>
    </div>

    <fieldset v-if="currentPreset" class="fieldset flex flex-col bg-base-200 rounded-lg p-3 mt-2 max-w-lg">
        <div class="flex flex-row gap-4">
            <div class="flex flex-col gap-2">
                <label class="fieldset-label text-sm">Preset Name</label>
                <input v-model="currentPreset.name" type="text" class="input" />

                <label class="fieldset-label text-sm">Max Response Tokens</label>
                <NumberInput v-model="currentPreset.maxTokens" class="input" min="0" />

                <label class="fieldset-label text-sm">Temperature</label>
                <NumberInput v-model="currentPreset.temperature" class="input" step="0.1" min="0" />

                <label class="fieldset-label text-sm">Seed</label>
                <NumberInput v-model="currentPreset.seed" class="input" min="0" />
            </div>

            <div class="flex flex-col gap-2">
                <label class="fieldset-label text-sm">Min P</label>
                <NumberInput v-model="currentPreset.minP" class="input" step="0.01" min="0" />

                <label class="fieldset-label text-sm">Top P</label>
                <NumberInput v-model="currentPreset.topP" class="input" step="0.01" min="0" />

                <label class="fieldset-label text-sm">Top K</label>
                <NumberInput v-model="currentPreset.topK" class="input" min="0" />
                <label class="fieldset-label text-sm">Presence-penalty</label>
                <NumberInput v-model="currentPreset.presencePenalty" class="input" />

                <label class="fieldset-label text-sm">Frequency-penalty</label>
                <NumberInput v-model="currentPreset.frequencyPenalty" class="input" />
            </div>
        </div>

        <div class="divider"></div>

        <div class="flex flex-row space-x-2">
            <button v-if="createMode" @click="createPreset" class="btn btn-primary">Create</button>
            <button v-else @click="updatePreset" class="btn btn-primary">Save</button>
            <button v-if="!createMode" @click="deletePreset" class="btn btn-error">Delete</button>
        </div>
    </fieldset>

    <div v-else>Preset not found</div>
</template>
