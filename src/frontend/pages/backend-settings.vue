<script lang="ts" setup>
import {ref} from 'vue'

const models = ref([])
const currentModel = ref('')
const modelLoaded = ref(false)
const modelFolder = ref('')
const localServerBase = `http://localhost:31700`

const getStatus = async () => {
    const res = await fetch(`${localServerBase}/api/status`)
    const data = await res.json()
    console.log(data)
    currentModel.value = data.currentModel
    modelLoaded.value = data.modelLoaded
    modelFolder.value = data.modelDir
}

const getModels = async () => {
    const res = await fetch(`${localServerBase}/api/models`)
    const data = await res.json()
    console.log(data)
    return data
}

const loadModel = async (modelName: string) => {
    const response = await fetch(`${localServerBase}/api/load-model`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({modelName}),
    })
    const data = await response.json()
    console.log(data)
}

const setModelDir = async () => {
    const res = await fetch(`${localServerBase}/api/set-model-dir`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({dir: modelFolder.value}),
    })
    const data = await res.json()
    console.log(data)
    getModels()
}

models.value = await getModels()
await getStatus()
</script>

<template>
    <div class="p-3">
        <div class="flex flex-col">
            <h2 class="text-lg">Currently Loaded Model</h2>
            <p>Loaded: {{ modelLoaded }}</p>
            <p>{{ currentModel }}</p>

            <h2 class="text-lg mt-3">Model Folder</h2>
            <div class="flex flex-row">
                <input type="text" class="input input-bordered" v-model="modelFolder" />
                <button class="btn btn-primary" @click="setModelDir">Update</button>
            </div>

            <h2 class="text-lg mt-3">Models</h2>
            <div v-for="model in models" :key="model" class="flex flex-row rounded-lg bg-base-200 p-3 mt-3">
                <p>{{ model.name }}</p>
                <button class="btn btn-primary ml-auto" @click="loadModel(model.name)">Load</button>
            </div>
        </div>
    </div>
</template>
