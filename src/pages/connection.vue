<script lang="ts" setup>
import {useConnectionStore} from '../store'

const connectionStore = useConnectionStore()
const models = ref([])

const saveConnection = () => {
    connectionStore.update()
}

const testConnection = async () => {
    let checkUrl = ''
    if (connectionStore.apiType === 'llamacpp') {
        // checkUrl = `${connectionStore.apiUrl}/v1/models`
        checkUrl = `${connectionStore.apiUrl}/health`
    } else if (connectionStore.apiType === 'koboldcpp') {
        checkUrl = `${connectionStore.apiUrl}/api/v1/model`
    }

    const response = await fetch(checkUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })

    if (connectionStore.apiType === 'llamacpp') {
        const {data} = await response.json()
        models.value = [data[0].id]
    } else if (connectionStore.apiType === 'koboldcpp') {
        const {result} = await response.json()
        models.value = [result]
    }
}
</script>

<template>
    <div class="flex flex-col p-5">
        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">API Type</span>
            </div>
            <select class="select select-bordered" v-model="connectionStore.apiType">
                <option selected value="llamacpp">LlamaCPP Server</option>
                <option value="koboldcpp">KoboldCPP</option>
            </select>
        </label>

        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">API URL</span>
            </div>
            <input type="text" class="input input-bordered" v-model="connectionStore.apiUrl" />
        </label>

        <div class="flex flex-row mt-5">
            <button class="btn btn-primary" @click="saveConnection">Save</button>
            <button class="btn btn-secondary" @click="testConnection">Test</button>
        </div>

        <div>
            Models:
            <ul>
                <li v-for="model in models" :key="model">
                    {{ model }}
                </li>
            </ul>
        </div>
    </div>
</template>
