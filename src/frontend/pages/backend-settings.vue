<script lang="ts" setup>
import {ref} from 'vue'
import {useToast} from 'vue-toastification'
import {ArrowPathIcon, CheckCircleIcon} from '@heroicons/vue/24/outline'
import TopBar from '@/components/top-bar.vue'
import {client} from '@/api-client'
import {useModelStore} from '@/store'
import NumberInput from '@/components/number-input.vue'

const toast = useToast()
const modelStore = useModelStore()

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
const modelLoadPending = ref(false)

const getStatus = async () => {
    const data = await client.llamaCpp.status.query()
    modelLoaded.value = data.loaded
    currentModel.value = data.currentModel
    modelPath.value = data.modelPath
    contextSize.value = data.contextSize
    autoLoad.value = data.autoLoad
    selectModel.value = data.currentModel
    batchSize.value = data.batchSize
    gpuLayers.value = data.gpuLayers
    useFlashAttn.value = data.useFlashAttn
}

const getModels = async () => {
    models.value = await client.models.getAll.query()
}

const loadModel = async () => {
    if (!selectModel.value) {
        throw new Error('No model selected')
    }

    try {
        modelLoadPending.value = true
        await client.llamaCpp.loadModel.query({
            modelFile: selectModel.value,
            contextSize: contextSize.value,
            batchSize: batchSize.value,
            gpuLayers: gpuLayers.value,
            useFlashAttn: useFlashAttn.value,
        })
        toast.success('Model loaded')
        currentModel.value = selectModel.value
        modelStore.loaded = true
    } finally {
        modelLoadPending.value = false
    }
}

const unloadModel = async () => {
    await client.llamaCpp.unloadModel.query()
    toast.success('Model unloaded')
    currentModel.value = ''
    selectModel.value = ''
}

const setModelDir = async () => {
    await client.models.setModelPath.mutate(modelPath.value)
    toast.success('Model path updated')
    await getModels()
}

const setAutoLoad = async () => {
    await client.models.setAutoLoad.mutate(autoLoad.value)
    toast.success('Autoload updated')
}

await getStatus()
await getModels()
</script>

<template>
    <TopBar title="Models" />

    <div class="p-3">
        <div class="flex flex-col">
            <div class="flex flex-row max-w-96">
                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Model Folder</span>
                    </div>
                    <div>
                        <input type="text" class="input input-bordered w-full md:max-w-96" v-model="modelPath" />
                    </div>
                </label>
                <button class="btn btn-primary btn-square mt-auto ml-3" @click="setModelDir">
                    <CheckCircleIcon class="size-6" />
                </button>
            </div>

            <label class="form-control w-full max-w-96 mt-3">
                <div class="label">
                    <span class="label-text">Context size</span>
                    <div class="tooltip" data-tip="Controls the maximum prompt size.">
                        <div class="badge badge-secondary badge-md">?</div>
                    </div>
                </div>
                <NumberInput class="input input-bordered w-full md:max-w-96" v-model="contextSize" />
            </label>

            <label class="form-control w-full max-w-96 mt-3">
                <div class="label">
                    <span class="label-text">Batch size</span>
                </div>
                <NumberInput class="input input-bordered w-full md:max-w-96" v-model="batchSize" />
            </label>

            <label class="form-control w-full max-w-96 mt-3">
                <div class="label">
                    <span class="label-text">GPU layers</span>
                </div>
                <NumberInput class="input input-bordered w-full md:max-w-96" v-model="gpuLayers" />
            </label>

            <label class="form-control w-full max-w-96 mt-3">
                <div class="label">
                    <span class="label-text">Use Flash Attention</span>
                </div>
                <input type="checkbox" class="toggle toggle-primary" v-model="useFlashAttn" />
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
                    <ArrowPathIcon class="size-6" />
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

<style>
/* Lets you use newlines (with &#10;) in the tooltip */
.tooltip:before {
    white-space: pre-line;
}
</style>
