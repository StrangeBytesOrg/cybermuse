<script lang="ts" setup>
import {ref} from 'vue'
import createClient from 'openapi-fetch'
import type {paths} from '../api.d.ts'
import {listFiles, fileDownloadInfo, listModels} from '@huggingface/hub'
import {useToast} from 'vue-toastification'

const client = createClient<paths>({
    baseUrl: 'http://localhost:31700',
})
const toast = useToast()

type models = {name: string; size: number}[]
const models = ref<models>([])
const currentModel = ref('')
const modelLoaded = ref(false)
const modelFolder = ref('')
const autoLoad = ref(false)
const hfUrl = ref('')
const hfFiles = ref([])
const downloadPending = ref(false)
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

const getModelInfo = async () => {
    hfFiles.value = []
    try {
        const wat = listFiles({repo: hfUrl.value})
        for await (const file of wat) {
            if (file.path.endsWith('.gguf')) {
                hfFiles.value.push({name: file.path, size: file.size})
            }
        }
    } catch (err) {
        toast.error('Model not found')
    }
}

const downloadModel = async (repoId: string, path: string) => {
    downloadPending.value = true
    const {error} = await client.POST('/api/download-model', {
        body: {
            repoId,
            path,
        },
    })
    if (error) {
        // TODO handle error
        console.error(error)
        toast.error('Failed to download model')
    } else {
        toast.success('Model downloaded')
    }
    downloadPending.value = false
}

// const searchModels = async () => {
//     const models = listModels({search: {tags: ['gguf']}})
//     for await (const model of models) {
//         console.log(model)
//     }
// }

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

            <div class="card mt-5">
                <h2 class="text-lg mt-3">Download Model from Huggingface</h2>
                <div class="divider mt-0 mb-1"></div>
                <div class="flex flex-row">
                    <input
                        v-model="hfUrl"
                        @keydown.enter="getModelInfo"
                        type="text"
                        class="input input-bordered w-full"
                        placeholder="Model Id, eg: TheBloke/Phi-2-GGUF" />
                    <button @click="getModelInfo" class="btn btn-primary ml-2">Get Model Info</button>
                </div>
                <dev v-if="hfFiles" class="mt-2">
                    <div v-for="file in hfFiles" :key="file" class="flex flex-row bg-base-200 rounded-md p-2 mt-1">
                        <div class="flex flex-col flex-grow">
                            <div>{{ file.name }}</div>
                            <div>{{ (file.size / 1024 / 1024 / 1024).toFixed(2) }}GB</div>
                        </div>
                        <button
                            class="btn btn-primary"
                            @click="downloadModel(hfUrl, file.name)"
                            :disabled="downloadPending">
                            Download
                        </button>
                    </div>
                </dev>

                <!-- HF Search -->
                <!-- <div class="flex flex-row">
                    <input
                        v-model="searchQuery"
                        @keydown.enter="searchModels"
                        type="text"
                        class="input input-bordered"
                        placeholder="Search Query" />
                    <button @click="searchModels" class="btn btn-primary ml-1">Search</button>
                </div>
                <div class="flex flex-col">
                    <details
                        v-for="result in searchResults"
                        :key="result"
                        class="collapse bg-base-200 rounded-md p-2 mt-2 hover:outline outline-primary">
                        <summary class="collapse-title">
                            {{ result.name }}
                        </summary>
                        <div class="collapse-content bg-base-100">
                            Downloads: {{ result.downloads }} Files: {{ result.files }}
                            <div v-for="file in result.files">
                                {{ file }}
                            </div>
                        </div>
                    </details>
                </div> -->
            </div>
        </div>
    </div>
</template>
