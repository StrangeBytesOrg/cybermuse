<script lang="ts" setup>
import {ref} from 'vue'
import {client} from '../api-client'
import {useToast} from 'vue-toastification'

const toast = useToast()

type models = {name: string; size: number}[]
const models = ref<models>([])
const currentModel = ref('')
const selectModel = ref('')
const modelLoaded = ref(false)
const modelPath = ref('')
const contextSize = ref(8192)
const autoLoad = ref(false)
const useGPU = ref(false)
const modelLoadPending = ref(false)

const getStatus = async () => {
    const {data, error} = await client.GET('/status')
    if (error) {
        console.error(error)
        toast.error('Error getting server status')
    } else {
        modelLoaded.value = data.loaded
        currentModel.value = data.currentModel
        modelPath.value = data.modelPath
        contextSize.value = data.contextSize
        autoLoad.value = data.autoLoad
        selectModel.value = data.currentModel
        useGPU.value = data.useGPU
    }
}

const getModels = async () => {
    models.value = []
    const {data, error} = await client.GET('/models')
    if (error) {
        // TODO properly handle error
        toast.error('Failed to get models')
    } else {
        models.value = data.models
    }
}

const loadModel = async () => {
    modelLoadPending.value = true
    const {error} = await client.POST('/start-server', {
        body: {
            modelFile: selectModel.value,
            contextSize: contextSize.value,
            useGPU: useGPU.value,
        },
    })
    if (error) {
        toast.error(`Failed to load model\n${error.message}`)
        console.error(error)
    } else {
        toast.success('Model loaded')
        currentModel.value = selectModel.value
    }
    modelLoadPending.value = false
}

const unloadModel = async () => {
    const {error} = await client.POST('/stop-server')
    if (error) {
        toast.error(`Failed to unload model\n${error.message}`)
    } else {
        toast.success('Model unloaded')
        currentModel.value = ''
        selectModel.value = ''
    }
}

const setModelDir = async () => {
    const {error} = await client.POST('/set-model-path', {
        body: {
            modelPath: modelPath.value,
        },
    })
    if (error) {
        console.error(error)
        toast.error(error.message)
    } else {
        toast.success('Model path updated')
        await getModels()
    }
}

const setAutoLoad = async () => {
    const {error} = await client.POST('/set-autoload', {
        body: {
            autoLoad: autoLoad.value,
        },
    })
    if (error) {
        toast.error(`Failed to update autoload\n${error.message}`)
    } else {
        toast.success('Autoload updated')
    }
}

await getStatus()
await getModels()
</script>

<template>
    <div class="p-3">
        <div class="flex flex-col">
            <h2 class="text-md mt-3">Model Folder</h2>
            <div class="flex flex-row mt-1">
                <input type="text" class="input input-bordered max-w-96 flex-grow" v-model="modelPath" />
                <button class="btn btn-primary ml-2" @click="setModelDir">Update</button>
            </div>

            <h2 class="text-md mt-3">Model</h2>
            <div class="flex flex-row mt-1">
                <select v-model="selectModel" class="select select-bordered max-w-96 flex-grow">
                    <option v-for="model in models" :key="model.name">
                        {{ model.name }}
                    </option>
                    <option v-if="!models.length" disabled>No models found</option>
                </select>

                <button @click="getModels" class="btn btn-primary ml-2">Refresh</button>
                <button @click="loadModel" :disabled="modelLoadPending" class="btn btn-primary ml-2">Load</button>
                <button @click="unloadModel" :disabled="modelLoadPending" class="btn btn-primary ml-2">Unload</button>
            </div>

            <div class="form-control w-52 mt-3">
                <label class="label">
                    <span class="label-text min-w-28">Context size</span>
                    <input type="number" class="input input-bordered" v-model="contextSize" />
                </label>
            </div>

            <div class="form-control w-52 mt-3">
                <label class="cursor-pointer label">
                    <span class="label-text text-lg">Use GPU</span>
                    <input type="checkbox" class="toggle toggle-primary" v-model="useGPU" />
                </label>
            </div>

            <div class="form-control w-52 mt-3">
                <label class="cursor-pointer label">
                    <span class="label-text text-lg">Auto load model</span>
                    <input type="checkbox" class="toggle toggle-primary" v-model="autoLoad" @change="setAutoLoad" />
                </label>
            </div>
        </div>
    </div>
</template>
