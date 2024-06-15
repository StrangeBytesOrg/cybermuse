<script lang="ts" setup>
import {ref} from 'vue'
import {useToast} from 'vue-toastification'
import {client} from '../api-client'

const toast = useToast()

const {data, error} = await client.GET('/presets')
if (error) {
    toast.error('Error getting presets')
}

const presets = ref(data?.presets || [])
// const selectedPreset = ref(presets?.value.find((preset) => preset.active)?.id || 0)
const selectedPreset = ref(data?.activePresetId || 0)

const setActivePreset = async () => {
    const {error} = await client.POST('/set-active-preset/{id}', {
        params: {path: {id: String(selectedPreset.value)}},
    })
    if (error) {
        toast.error('Error setting active preset')
    } else {
        toast.success('Active preset set')
    }
}
</script>

<template>
    <div class="p-2">
        <div class="flex flex-row">
            <div class="flex flex-col">
                <h2 class="text-md">Active Preset</h2>
                <select v-model="selectedPreset" @change="setActivePreset" class="select select-bordered min-w-60">
                    <option v-for="preset in presets" :key="preset.id" :value="preset.id">
                        {{ preset.name }}
                    </option>
                </select>
            </div>

            <router-link to="/create-preset" class="btn btn-primary mt-auto ml-3">Create Preset</router-link>
        </div>

        <div class="flex flex-col">
            <div v-for="preset in presets" :key="preset.id" class="flex flex-row bg-base-200 rounded-lg p-2 mt-2">
                <h3 class="text-lg font-bold">{{ preset.name }}</h3>
                <div class="ml-auto">
                    <router-link :to="`preset/${preset.id}`" class="btn btn-neutral ml-2">Edit</router-link>
                </div>
            </div>
        </div>
    </div>
</template>
