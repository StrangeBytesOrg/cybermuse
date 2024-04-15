<script lang="ts" setup>
import {ref, computed} from 'vue'
import {useToast} from 'vue-toastification'
import {client} from '../api-client'

const toast = useToast()
const selectedPresetId = ref(1)

const {data} = await client.GET('/api/get-generate-presets')
const generationPresets = ref(data || [])

const selectedPreset = computed(() => {
    return generationPresets.value.find((preset) => preset.id === selectedPresetId.value)
})

const createPreset = async () => {
    const {error} = await client.POST('/api/create-generate-preset', {
        body: {
            name: selectedPreset.value.name,
            temperature: selectedPreset.value.temperature,
            maxTokens: selectedPreset.value.maxTokens,
            minP: selectedPreset.value.minP,
            topP: selectedPreset.value.topP,
            topK: selectedPreset.value.topK,
        },
    })
    if (error) {
        console.error(error)
        toast.error('Failed to save settings')
    } else {
        toast.success('Settings saved')
        // Refresh presets
        const response = await client.GET('/api/get-generate-presets')
        generationPresets.value = response.data
    }
}

const updatePreset = async () => {
    const {error} = await client.POST('/api/update-generate-preset', {
        body: {
            id: selectedPresetId.value,
            name: selectedPreset.value.name,
            temperature: selectedPreset.value.temperature,
            maxTokens: selectedPreset.value.maxTokens,
            minP: selectedPreset.value.minP,
            topP: selectedPreset.value.topP,
            topK: selectedPreset.value.topK,
        },
    })
    if (error) {
        console.error(error)
        toast.error('Failed to save settings')
    } else {
        toast.success('Settings saved')
    }
}

const deletePreset = async () => {
    const {error} = await client.POST('/api/delete-generate-preset', {
        body: {
            id: selectedPresetId.value,
        },
    })
    if (error) {
        console.error(error)
        toast.error(error.message || 'Failed to delete preset')
    } else {
        toast.success('Preset deleted')
        // Refresh presets
        const response = await client.GET('/api/get-generate-presets')
        generationPresets.value = response.data
    }
}
</script>

<template>
    <div class="p-2">
        <div class="flex flex-row">
            <label class="form-control w-full">
                <div class="label">
                    <span class="label-text">Preset</span>
                </div>
                <select v-model="selectedPresetId" class="select select-bordered">
                    <option v-for="preset in generationPresets" :value="preset.id" :key="preset.id">
                        {{ preset.name }}
                    </option>
                </select>
            </label>

            <button class="btn btn-primary mt-auto ml-3" @click="createPreset">Create Preset</button>
        </div>

        <div v-if="selectedPreset" class="flex flex-row justify-between bg-base-200 p-2 pb-4 mt-3 rounded-lg">
            <div class="flex flex-col">
                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Preset Name</span>
                    </div>
                    <input type="text" class="input input-bordered" v-model="selectedPreset.name" />
                </label>

                <label class="form-control w-full max-w-xs">
                    <div class="label">
                        <span class="label-text">Temperature</span>
                    </div>
                    <input type="number" class="input input-bordered" v-model="selectedPreset.temperature" />
                </label>

                <label class="form-control w-full max-w-xs">
                    <div class="label">
                        <span class="label-text">Max Tokens</span>
                    </div>
                    <input type="number" class="input input-bordered" v-model="selectedPreset.maxTokens" />
                </label>
            </div>
            <div class="flex flex-col">
                <label class="form-control w-full max-w-xs">
                    <div class="label">
                        <span class="label-text">Min P</span>
                    </div>
                    <input type="number" class="input input-bordered" v-model="selectedPreset.minP" />
                </label>

                <label class="form-control w-full max-w-xs">
                    <div class="label">
                        <span class="label-text">Top P</span>
                    </div>
                    <input type="number" class="input input-bordered" v-model="selectedPreset.topP" />
                </label>

                <label class="form-control w-full max-w-xs">
                    <div class="label">
                        <span class="label-text">Top K</span>
                    </div>
                    <input type="number" class="input input-bordered" v-model="selectedPreset.topK" />
                </label>
            </div>
        </div>

        <div class="mt-3">
            <button class="btn btn-primary" @click="updatePreset">Update Preset</button>
            <button class="btn btn-error ml-3" @click="deletePreset">Delete Preset</button>
        </div>
    </div>
</template>
