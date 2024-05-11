<script lang="ts" setup>
import {ref} from 'vue'
import {useToast} from 'vue-toastification'
import {useRoute, useRouter} from 'vue-router'
import {client} from '../api-client'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const presetId = Number(route.params.id)

const {data} = await client.GET('/preset/{id}', {
    params: {path: {id: String(presetId)}},
})
const presetName = ref(data?.preset.name || '')
const temperature = ref(data?.preset.temperature || 0)
const maxTokens = ref(data?.preset.maxTokens || 0)
const minP = ref(data?.preset.minP || 0)
const topP = ref(data?.preset.topP || 0)
const topK = ref(data?.preset.topK || 0)

const updatePreset = async () => {
    const {error} = await client.POST('/update-preset/{id}', {
        params: {path: {id: String(presetId)}},
        body: {
            name: presetName.value,
            temperature: temperature.value,
        },
    })
    if (error) {
        toast.error('Error updating preset')
    } else {
        toast.success('Preset updated')
    }
}

const deletePreset = async () => {
    const {error} = await client.POST('/delete-preset/{id}', {
        params: {path: {id: String(presetId)}},
    })
    if (error) {
        toast.error(`Error deleting preset\n${error.detail}`)
    } else {
        toast.success('Preset deleted')
        router.push('/presets')
    }
}
</script>

<template>
    <div class="flex flex-col bg-base-200 rounded-lg p-3 m-2">
        <label class="form-control w-full">
            <div class="label">
                <span class="label-text">Preset Name</span>
            </div>
            <input
                type="text"
                v-model="presetName"
                class="input input-bordered mb-auto mr-5 max-w-80 border-2 focus:outline-none focus:border-primary" />
        </label>

        <label class="form-control w-full">
            <div class="label">
                <span class="label-text">Temperature</span>
            </div>
            <input
                type="number"
                v-model="temperature"
                class="input input-bordered mb-auto mr-5 max-w-80 border-2 focus:outline-none focus:border-primary" />
        </label>

        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">Max Tokens</span>
            </div>
            <input type="number" class="input input-bordered" v-model="maxTokens" />
        </label>

        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">Min P</span>
            </div>
            <input type="number" class="input input-bordered" v-model="minP" />
        </label>

        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">Top P</span>
            </div>
            <input type="number" class="input input-bordered" v-model="topP" />
        </label>

        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">Top K</span>
            </div>
            <input type="number" class="input input-bordered" v-model="topK" />
        </label>

        <div class="flex flex-row space-x-2 mt-5">
            <button @click="updatePreset" class="btn btn-primary flex-grow">Save</button>
            <button @click="deletePreset" class="btn btn-error flex-grow">Delete</button>
        </div>
    </div>
</template>
