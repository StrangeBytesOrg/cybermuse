<script lang="ts" setup>
import {ref} from 'vue'
import {client} from '../api-client'
// import {useToast} from 'vue-toastification'

// const toast = useToast()

type models = {name: string; size: number}[]
const models = ref<models>([])
const currentModel = ref('')
const modelLoaded = ref(false)
const modelFolder = ref('')
const autoLoad = ref(false)
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
    const {error} = await client.POST('/api/load-model', {
        body: {
            modelName,
        },
    })
    if (error) {
        console.log(error)
    } else {
        console.log('Loaded model')
    }
}

const setModelDir = async () => {
    const {error} = await client.POST('/api/set-model-dir', {
        body: {
            dir: modelFolder.value,
        },
    })
    if (error) {
        // TODO handle error
        console.log(error)
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
            <!-- <p>Loaded: {{ modelLoaded }}</p>
            <p>{{ currentModel }}</p> -->

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

            <h2 class="text-lg mt-3">Models</h2>
            <div v-for="model in models" :key="model.name" class="flex flex-row rounded-lg bg-base-200 p-3 mt-3">
                <div class="flex flex-col">
                    <p>{{ model.name }}</p>
                </div>
                <!-- TODO: Show currently loaded -->
                <button class="btn btn-primary ml-auto" @click="loadModel(model.name)">Load</button>
            </div>
        </div>
    </div>
</template>
