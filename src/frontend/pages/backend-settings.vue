<script lang="ts" setup>
import {ref} from 'vue'
import createClient from 'openapi-fetch'
import type {paths} from '../api.d.ts'

const client = createClient<paths>({
    baseUrl: 'http://localhost:31700',
})

type models = {name: string}[]
const models = ref<models>([])
const currentModel = ref('')
const modelLoaded = ref(false)
const modelFolder = ref('')

const getStatus = async () => {
    const {data, error} = await client.GET('/api/status')
    if (error) {
        console.error(error)
    } else {
        modelLoaded.value = data.modelLoaded
        currentModel.value = data.currentModel
        modelFolder.value = data.modelDir
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

const setAutoLoad = async (autoLoad: boolean) => {
    const {error} = await client.POST('/api/set-auto-load', {
        body: {
            autoLoad,
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
            <h2 class="text-lg">Currently Loaded Model</h2>
            <p>Loaded: {{ modelLoaded }}</p>
            <p>{{ currentModel }}</p>

            <h2 class="text-lg mt-3">Model Folder</h2>
            <div class="flex flex-row">
                <input type="text" class="input input-bordered" v-model="modelFolder" />
                <button class="btn btn-primary" @click="setModelDir">Update</button>
            </div>

            <button class="btn btn-primary mt-3" @click="setAutoLoad(true)">Enable Auto Load</button>
            <button class="btn btn-primary mt-3" @click="setAutoLoad(false)">Disable Auto Load</button>

            <h2 class="text-lg mt-3">Models</h2>
            <div v-for="model in models" :key="model" class="flex flex-row rounded-lg bg-base-200 p-3 mt-3">
                <p>{{ model.name }}</p>
                <button class="btn btn-primary ml-auto" @click="loadModel(model.name)">Load</button>
            </div>
        </div>
    </div>
</template>
