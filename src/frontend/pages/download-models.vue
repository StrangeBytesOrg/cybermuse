<script lang="ts" setup>
import {ref} from 'vue'
import {listFiles} from '@huggingface/hub'
import {useToast} from 'vue-toastification'
import {client} from '../api-client'

const hfUrl = ref('')
const hfFiles = ref([])
const downloadPending = ref(false)
const toast = useToast()

const getModelInfo = async () => {
    hfFiles.value = []
    try {
        const wat = listFiles({repo: hfUrl.value})
        for await (const file of wat) {
            if (file.path.endsWith('.gguf')) {
                hfFiles.value.push({name: file.path, size: file.size})
            }
        }
        if (!hfFiles.value.length) {
            toast.error('No GGUF files found')
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
</script>

<template>
    <div class="card p-3">
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
        <div v-if="hfFiles.length" class="mt-2">
            <div v-for="file in hfFiles" :key="file" class="flex flex-row bg-base-200 rounded-md p-2 mt-1">
                <div class="flex flex-col flex-grow">
                    <div>{{ file.name }}</div>
                    <div>{{ (file.size / 1024 / 1024 / 1024).toFixed(2) }}GB</div>
                </div>
                <button class="btn btn-primary" @click="downloadModel(hfUrl, file.name)" :disabled="downloadPending">
                    Download
                </button>
            </div>
        </div>

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
</template>
