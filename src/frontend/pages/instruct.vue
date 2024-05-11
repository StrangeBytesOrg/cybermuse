<script lang="ts" setup>
import {ref} from 'vue'
import {useConnectionStore} from '../store'
import {client} from '../api-client'
import {responseToIterable} from '../lib/fetch-backend'
import {useToast} from 'vue-toastification'

const connectionStore = useConnectionStore()
const pendingMessage = ref(false)
const currentInput = ref('')
const systemPrompt = ref('')
const generatedResponse = ref('')
const toast = useToast()
let controller: AbortController

// Check if generation server is actually running
const checkServer = async () => {
    const {data, error} = await client.GET('/status')
    if (error) {
        toast.error('Error getting server status')
    }
    if (data && data.loaded) {
        connectionStore.connected = true
    }
}
await checkServer()

const getGeneration = async () => {
    pendingMessage.value = true
    generatedResponse.value = ''
    controller = new AbortController()

    try {
        const {response} = await client.POST('/generate', {
            body: {
                prompt: currentInput.value,
                // instruction: systemPrompt.value || undefined,
            },
            signal: controller.signal,
            parseAs: 'stream',
        })
        const responseIterable = responseToIterable(response)
        for await (const chunk of responseIterable) {
            const data = JSON.parse(chunk.data)
            if (chunk.event === 'text') {
                generatedResponse.value += data.text
            } else if (chunk.event === 'final') {
                generatedResponse.value = data.text
            } else if (chunk.event === 'error') {
                console.error('Error', data)
                toast.error(`Error generating message: ${data.error}`)
            } else {
                console.error('Unknown event', chunk)
            }
        }
    } catch (err) {
        switch (err.name) {
            case 'AbortError':
                console.log('Aborted')
                break
            default:
                console.error(err)
                toast.error(`Error generating message: ${err.message}`)
        }
    } finally {
        pendingMessage.value = false
    }
}

const stop = async () => {
    console.log('Aborting generation')
    controller.abort('manual abort')
}
</script>

<template>
    <div class="flex flex-row flex-grow">
        <!-- Input -->
        <div class="flex flex-col flex-grow w-1/2 p-2">
            <textarea
                class="textarea textarea-bordered flex-grow text-base focus:outline-none focus:border-secondary border-2"
                placeholder="System Instruction"
                v-model="systemPrompt" />
            <textarea
                class="textarea textarea-bordered mt-1 flex-grow text-base focus:outline-none focus:border-secondary border-2"
                placeholder="Instruction"
                @keydown.ctrl.enter="getGeneration"
                :disabled="pendingMessage"
                v-model="currentInput" />

            <div class="flex flex-col">
                <div class="flex flex-row justify-between mt-3">
                    <button
                        @click="getGeneration"
                        :disabled="pendingMessage || connectionStore.connected === false"
                        class="btn btn-primary w-[48%]">
                        {{ pendingMessage ? '' : 'Generate' }}
                        <span class="loading loading-spinner loading-md" :class="{hidden: !pendingMessage}" />
                    </button>
                    <button @click="stop" :disabled="!pendingMessage" class="btn btn-primary w-[48%]">Stop</button>
                </div>
            </div>
        </div>

        <!-- Output -->
        <div class="flex flex-col w-1/2 p-2">
            <textarea
                class="textarea textarea-bordered flex-grow text-base focus:outline-none focus:border-secondary border-2"
                v-model="generatedResponse" />
        </div>
    </div>
</template>
