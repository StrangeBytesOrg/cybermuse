<script lang="ts" setup>
import {ref} from 'vue'
import {useToast} from 'vue-toastification'
import {ArrowPathIcon, CheckCircleIcon, ArrowDownIcon} from '@heroicons/vue/24/outline'
import TopBar from '@/components/top-bar.vue'
import {client, streamingClient} from '@/api-client'
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

// Downloading
const hfRepo = ref('')
const hfFile = ref('')
const progress = ref(0)

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

const downloadModel = async () => {
    const iterable = await streamingClient.models.downloadModel.mutate({repo: hfRepo.value, filename: hfFile.value})
    for await (const data of iterable) {
        console.log(data)
        progress.value = data.progress
    }
}

await getStatus()
await getModels()
</script>

<template>
    <TopBar title="Models" />

    <div class="p-3">
        <div class="flex flex-col md:flex-row">
            <div class="flex flex-col md:w-96">
                <div class="flex flex-row">
                    <label class="form-control w-full">
                        <div class="label">
                            <span class="label-text">Model Folder</span>
                        </div>
                        <input type="text" class="input input-bordered w-full md:max-w-96" v-model="modelPath" />
                    </label>
                    <button class="btn btn-primary btn-square mt-auto ml-3" @click="setModelDir">
                        <CheckCircleIcon class="size-6" />
                    </button>
                </div>

                <label class="form-control w-full mt-3">
                    <div class="label">
                        <span class="label-text">Context size</span>
                        <div class="tooltip" data-tip="Controls the maximum prompt size.">
                            <div class="badge badge-secondary badge-md">?</div>
                        </div>
                    </div>
                    <NumberInput class="input input-bordered w-full" v-model="contextSize" />
                </label>

                <label class="form-control w-full mt-3">
                    <div class="label">
                        <span class="label-text">Batch size</span>
                    </div>
                    <NumberInput class="input input-bordered w-full" v-model="batchSize" />
                </label>

                <label class="form-control w-full mt-3">
                    <div class="label">
                        <span class="label-text">GPU layers</span>
                    </div>
                    <NumberInput class="input input-bordered w-full" v-model="gpuLayers" />
                </label>

                <label class="form-control w-full mt-3">
                    <div class="label">
                        <span class="label-text">Use Flash Attention</span>
                    </div>
                    <input type="checkbox" class="toggle toggle-primary" v-model="useFlashAttn" />
                </label>

                <label class="form-control w-full mt-3">
                    <div class="label">
                        <span class="label-text">Auto load model</span>
                    </div>
                    <input type="checkbox" class="toggle toggle-primary" v-model="autoLoad" @change="setAutoLoad" />
                </label>

                <div class="flex flex-row">
                    <label class="form-control w-full mt-3">
                        <div class="label">
                            <span class="label-text">Model</span>
                        </div>
                        <select v-model="selectModel" class="select select-bordered w-full">
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

                <div class="flex flex-row mt-3 space-x-2">
                    <!-- <button @click="getModels" class="btn btn-primary flex-grow">Refresh</button> -->
                    <button @click="loadModel" :disabled="modelLoadPending" class="btn btn-primary flex-grow">
                        Load
                    </button>
                    <button @click="unloadModel" :disabled="modelLoadPending" class="btn btn-primary flex-grow">
                        Unload
                    </button>
                </div>
            </div>

            <div class="flex w-4"></div>

            <!-- Download -->
            <div class="flex flex-col md:w-96 mt-6 md:mt-0">
                <h2>Download Models</h2>

                <label class="form-control w-full mt-3">
                    <div class="label">
                        <span class="label-text">Huggingface Repo</span>
                    </div>
                    <input type="text" v-model="hfRepo" class="input input-bordered w-full" />
                </label>

                <div class="flex flex-row">
                    <label class="form-control w-full mt-3">
                        <div class="label">
                            <span class="label-text">GGUF Filename</span>
                        </div>
                        <input type="text" v-model="hfFile" class="input input-bordered w-full" />
                    </label>
                    <button @click="downloadModel" class="btn btn-square btn-primary ml-2 mt-auto">
                        <ArrowDownIcon class="size-6" />
                    </button>
                </div>

                <div v-if="progress > 0" class="mt-3">Progress: {{ progress }}%</div>
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
