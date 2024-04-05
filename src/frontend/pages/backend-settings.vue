<script lang="ts" setup>
import {ref} from 'vue'
import {client} from '../api-client'
import {useToast} from 'vue-toastification'

const toast = useToast()

type models = {name: string; size: number}[]
const models = ref<models>([])
const currentModel = ref('')
const modelLoaded = ref(false)
const modelFolder = ref('')
const autoLoad = ref(false)
const modelLoadPending = ref(false)
// const downloadUrl = ref('')
// const searchQuery = ref('')
// const searchResults = ref([])

const getStatus = async () => {
    const {data, error} = await client.GET('/api/status')
    if (error) {
        console.error(error)
    } else {
        modelLoaded.value = data.modelLoaded
        currentModel.value = data.currentModel
        modelFolder.value = data.modelDir
        autoLoad.value = data.autoLoad
    }
}

const getModels = async () => {
    const {data, error} = await client.GET('/api/models')
    if (error) {
        // TODO properly handle error
    } else {
        models.value = data
    }
}

const loadModel = async (modelName: string) => {
    modelLoadPending.value = true
    const {error} = await client.POST('/api/load-model', {
        body: {
            modelName,
        },
    })
    if (error) {
        toast.error('Failed to load model')
        console.error(error)
    } else {
        toast.success('Model loaded')
        currentModel.value = modelName
    }
    modelLoadPending.value = false
}

const setModelDir = async () => {
    const {error, data} = await client.POST('/api/set-model-dir', {
        body: {
            dir: modelFolder.value,
        },
    })
    if (error) {
        toast.error(error.message)
    } else {
        await getModels()
    }
}

const setAutoLoad = async () => {
    const {error} = await client.POST('/api/set-auto-load', {
        body: {
            autoLoad: autoLoad.value,
        },
    })
    if (error) {
        // TODO handle error
    } else {
        console.log('Updated autoload')
    }
}

await getStatus()
await getModels()
</script>

<template>
    <div class="p-3">
        <div class="flex flex-col">
            <h2 class="text-lg">Currently Loaded Model: {{ currentModel ? currentModel : 'none' }}</h2>
            <!-- <p>Loaded: {{ modelLoaded }}</p> -->

            <h2 class="text-lg mt-3">Model Folder</h2>
            <div class="flex flex-row">
                <input type="text" class="input input-bordered" v-model="modelFolder" />
                <button class="btn btn-primary ml-1" @click="setModelDir">Update</button>
            </div>

            <div class="form-control w-52 mt-3">
                <label class="cursor-pointer label">
                    <span class="label-text text-lg">Auto load model</span>
                    <input type="checkbox" class="toggle toggle-primary" v-model="autoLoad" @change="setAutoLoad" />
                </label>
            </div>

            <div class="flex flex-row">
                <h2 class="text-lg mt-3 w-full">Models</h2>
                <button class="btn btn-primary btn-sm btn-square mt-auto" @click="getModels">
                    <!-- prettier-ignore -->
                    <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                </button>
            </div>
            <div class="divider mt-0 mb-1"></div>
            <template v-if="models.length">
                <div v-for="model in models" :key="model.name" class="flex flex-row rounded-lg bg-base-200 p-3 mb-3">
                    <div class="flex flex-col">
                        <p>{{ model.name }}</p>
                    </div>
                    <button
                        @click="loadModel(model.name)"
                        class="btn btn-primary ml-auto"
                        :disabled="modelLoadPending || model.name === currentModel">
                        Load
                    </button>
                </div>
            </template>
            <template v-else>
                <p>No models found</p>
            </template>
        </div>
    </div>
</template>
