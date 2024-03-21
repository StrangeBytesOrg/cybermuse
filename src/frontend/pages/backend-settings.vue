<script lang="ts" setup>
import {ref} from 'vue'
import {client} from '../client'

const models = ref([])
const currentModel = ref('')
const modelLoaded = ref(false)
const modelFolder = ref('')

const getStatus = async () => {
    const {body, status} = await client.status()
    console.log(body)
    currentModel.value = body.currentModel
    modelLoaded.value = body.modelLoaded
    modelFolder.value = body.modelDir
}

const getModels = async () => {
    const {body, status} = await client.getModels()
    if (status === 200) {
        return body
    } else {
        console.error('Failed to get models')
        return []
    }
}

const loadModel = async (modelName: string) => {
    const {body, status} = await client.loadModel({body: {modelName}})
    if (status === 200) {
        console.log('Model loaded')
    } else {
        console.error('Failed to load model')
    }
}

const setModelDir = async () => {
    const {body, status} = await client.setModelDir({body: {dir: modelFolder.value}})
    if (status === 200) {
        console.log('Model folder updated')
    } else {
        console.error('Failed to update model folder')
    }
    getModels()
}

models.value = await getModels()
await getStatus()

if (modelLoaded.value === true) {
    const {body, status} = await client.generate({
        body: {
            prompt: 'Hello, my name is',
        },
    })
    console.log(body)
}
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
