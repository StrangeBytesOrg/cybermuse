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
const batchSize = ref(512)
const autoLoad = ref(false)
const gpuLayers = ref(0)
const useFlashAttn = ref(false)
const splitMode = ref<'layer' | 'row'>('layer')
const cacheTypeK = ref<'f16' | 'q8_0' | 'q4_0'>('f16')
const cacheTypeV = ref<'f16' | 'q8_0' | 'q4_0'>('f16')
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
        batchSize.value = data.batchSize
        gpuLayers.value = data.gpuLayers
        useFlashAttn.value = data.useFlashAttn
        splitMode.value = data.splitMode
        cacheTypeK.value = data.cacheTypeK
        cacheTypeV.value = data.cacheTypeV
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
    if (!selectModel.value) {
        toast.error('No model selected')
        return
    }

    modelLoadPending.value = true
    const {error} = await client.POST('/start-server', {
        body: {
            modelFile: selectModel.value,
            contextSize: contextSize.value,
            batchSize: batchSize.value,
            gpuLayers: gpuLayers.value,
            useFlashAttn: useFlashAttn.value,
            splitMode: splitMode.value,
            cacheTypeK: cacheTypeK.value,
            cacheTypeV: cacheTypeV.value,
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
            <div class="flex flex-row max-w-96">
                <label class="form-control w-full mt-3">
                    <div class="label">
                        <span class="label-text">Model Folder</span>
                    </div>
                    <div>
                        <input type="text" class="input input-bordered w-full md:max-w-96" v-model="modelPath" />
                    </div>
                </label>
                <button class="btn btn-primary btn-square mt-auto ml-3" @click="setModelDir">
                    <!-- prettier-ignore -->
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                </button>
            </div>

            <label class="form-control w-full max-w-96 mt-3">
                <div class="label">
                    <span class="label-text">Context size</span>
                </div>
                <input type="number" class="input input-bordered w-full md:max-w-96" v-model="contextSize" />
            </label>

            <label class="form-control w-full max-w-96 mt-3">
                <div class="label">
                    <span class="label-text">Batch size</span>
                </div>
                <input type="number" class="input input-bordered w-full md:max-w-96" v-model="batchSize" />
            </label>

            <label class="form-control w-full max-w-96 mt-3">
                <div class="label">
                    <span class="label-text">GPU layers</span>
                </div>
                <input type="number" class="input input-bordered w-full md:max-w-96" v-model="gpuLayers" />
            </label>

            <label class="form-control w-full max-w-96 mt-3">
                <div class="label">
                    <span class="label-text">Use Flash Attention</span>
                </div>
                <input type="checkbox" class="toggle toggle-primary" v-model="useFlashAttn" />
            </label>

            <label class="form-control w-full max-w-96 mt-3">
                <div class="label">
                    <span class="label-text">Split Mode</span>
                </div>
                <select v-model="splitMode" class="select select-bordered max-w-96 flex-grow">
                    <option value="layer">Layer (Default)</option>
                    <option value="row">Row</option>
                </select>
            </label>

            <label class="form-control w-full max-w-96 mt-3">
                <div class="label">
                    <span class="label-text">Cache Type K</span>
                </div>
                <select v-model="cacheTypeK" class="select select-bordered max-w-96 flex-grow">
                    <option value="f16">f16 (Default)</option>
                    <option value="q4_0">q4_0</option>
                    <option value="q8_0">q8_0</option>
                </select>
            </label>

            <label class="form-control w-full max-w-96 mt-3">
                <div class="label">
                    <span class="label-text">Cache Type V</span>
                </div>
                <select v-model="cacheTypeV" class="select select-bordered max-w-96 flex-grow">
                    <option value="f16">f16 (Default)</option>
                    <option value="q4_0">q4_0</option>
                    <option value="q8_0">q8_0</option>
                </select>
            </label>

            <label class="form-control w-full max-w-96 mt-3">
                <div class="label">
                    <span class="label-text">Auto load model</span>
                </div>
                <input type="checkbox" class="toggle toggle-primary" v-model="autoLoad" @change="setAutoLoad" />
            </label>

            <div class="flex flex-row max-w-96">
                <label class="form-control w-full mt-3">
                    <div class="label">
                        <span class="label-text">Model</span>
                    </div>
                    <select v-model="selectModel" class="select select-bordered max-w-96 flex-grow">
                        <option v-for="model in models" :key="model.name">
                            {{ model.name }}
                        </option>
                        <option v-if="!models.length" disabled>No models found</option>
                    </select>
                </label>
                <button @click="getModels" class="btn btn-neutral btn-square mt-auto ml-3">
                    <!-- prettier-ignore -->
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                </button>
            </div>

            <div class="flex flex-row mt-3 md:max-w-96 space-x-2">
                <!-- <button @click="getModels" class="btn btn-primary flex-grow">Refresh</button> -->
                <button @click="loadModel" :disabled="modelLoadPending" class="btn btn-primary flex-grow">Load</button>
                <button @click="unloadModel" :disabled="modelLoadPending" class="btn btn-primary flex-grow">
                    Unload
                </button>
            </div>
        </div>
    </div>
</template>
