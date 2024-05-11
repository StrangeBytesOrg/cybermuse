<script lang="ts" setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {useToast} from 'vue-toastification'
import {client} from '../api-client'

const toast = useToast()
const router = useRouter()
const presetName = ref('')
const temperature = ref(0)
const maxTokens = ref(0)
const minP = ref(0)
const topP = ref(0)
const topK = ref(0)

const createTemplate = async () => {
    const {error} = await client.POST('/create-preset', {
        body: {
            name: presetName.value,
            temperature: temperature.value,
        },
    })
    if (error) {
        console.error(error)
        toast.error(`Error creating template\n${error.detail}`)
    } else {
        toast.success('Template created')
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

        <button @click="createTemplate" class="btn btn-primary mt-2">Create Preset</button>
    </div>
</template>
