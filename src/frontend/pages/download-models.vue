<script lang="ts" setup>
import {ref} from 'vue'
import {listFiles} from '@huggingface/hub'
import {useToast} from 'vue-toastification'
import {client} from '../api-client'
import {responseToIterable} from '../lib/fetch-backend'

type HfFile = {
    repo: string
    name: string
    size: number
}
const toast = useToast()
const hfUrl = ref('')
const hfFiles = ref<HfFile[]>([])
const requestPending = ref(false)
const downloadPending = ref(false)
const downloadProgress = ref(0)
const selectedSuggestedModel = ref('')
const suggestedModels = [
    'NousResearch/Meta-Llama-3-8B-Instruct-GGUF',
    'microsoft/Phi-3-mini-4k-instruct-gguf',
    'NousResearch/Hermes-2-Pro-Llama-3-8B-GGUF',
    'NousResearch/Hermes-2-Pro-Mistral-7B-GGUF',
    'TheBloke/Mistral-7B-Instruct-v0.2-GGUF',
]

const getModelInfo = async (repo: string) => {
    requestPending.value = true
    hfFiles.value = []
    try {
        const files = listFiles({repo})
        for await (const file of files) {
            if (file.path.endsWith('.gguf')) {
                hfFiles.value.push({repo, name: file.path, size: file.size})
            }
        }
        if (!hfFiles.value.length) {
            toast.error('No GGUF files found')
        }
    } catch (err) {
        toast.error('Model not found')
    }
    requestPending.value = false
}

const downloadModel = async (repoId: string, path: string) => {
    downloadPending.value = true
    const {response} = await client.POST('/download-model', {
        body: {
            repoId,
            path,
        },
        parseAs: 'stream',
    })
    const iterable = responseToIterable(response)
    for await (const chunk of iterable) {
        const data = JSON.parse(chunk.data)
        if (chunk.event === 'progress') {
            downloadProgress.value = data.progress.toFixed(2)
        } else if (chunk.event === 'final') {
            toast.success('Model downloaded')
            downloadProgress.value = 0
            downloadPending.value = false
        } else if (chunk.event === 'error') {
            toast.error(data.error)
            downloadPending.value = false
        }
    }
}

// const searchModels = async () => {
//     const models = listModels({search: {tags: ['gguf']}})
//     for await (const model of models) {
//         console.log(model)
//     }
// }
</script>

<template>
    <div class="p-2">
        You can find compatible models at
        <a href="https://huggingface.co/models?library=gguf" target="_blank" class="link">Huggingface</a>

        <div class="flex flex-row mt-3">
            <select
                class="select select-bordered w-full"
                v-model="selectedSuggestedModel"
                @change.prevent="getModelInfo(selectedSuggestedModel)">
                <option value="" disabled>Suggested Models</option>
                <option v-for="model in suggestedModels" :key="model" :value="model">{{ model }}</option>
            </select>
        </div>

        <div class="flex flex-row mt-3">
            <input
                v-model="hfUrl"
                @keydown.enter="getModelInfo(hfUrl)"
                type="text"
                class="input input-bordered w-full"
                placeholder="Model Id, eg: TheBloke/Phi-2-GGUF" />
            <button @click="getModelInfo(hfUrl)" class="btn btn-primary w-40 ml-2">Get Model Info</button>
        </div>
        <div v-if="hfFiles.length" class="mt-2">
            <div v-for="file in hfFiles" :key="file.name" class="flex flex-row bg-base-200 rounded-md p-2 mt-1">
                <div class="flex flex-col flex-grow">
                    <div>{{ file.name }}</div>
                    <div>{{ (file.size / 1024 / 1024 / 1024).toFixed(2) }}GB</div>
                </div>
                <button
                    class="btn btn-primary"
                    @click="downloadModel(file.repo, file.name)"
                    :disabled="downloadPending">
                    Download
                </button>
            </div>
        </div>
        <span v-if="requestPending" class="loading loading-spinner loading-lg mt-5"></span>

        <div v-if="downloadPending" class="mt-3">Download Progress: {{ downloadProgress }}%</div>

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
