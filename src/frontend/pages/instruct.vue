<script lang="ts" setup>
import {ref} from 'vue'
import {useConnectionStore, useSettingsStore} from '../store'
import {client} from '../api-client'
import {responseToIterable} from '../lib/fetch-backend'
import {useToast} from 'vue-toastification'

const connectionStore = useConnectionStore()
const settingsStore = useSettingsStore()
const pendingMessage = ref(false)
const currentInput = ref('')
const generatedResponse = ref('')
const toast = useToast()
let controller: AbortController

const getGeneration = async () => {
    pendingMessage.value = true
    generatedResponse.value = currentInput.value
    controller = new AbortController()

    // TODO add instruct syntax to prompt

    try {
        const {response} = await client.POST('/api/generate-stream', {
            body: {
                prompt: currentInput.value,
                maxTokens: settingsStore.generationSettings.maxTokens,
                temperature: settingsStore.generationSettings.temperature,
                minP: settingsStore.generationSettings.minP,
                topP: settingsStore.generationSettings.topP,
                topK: settingsStore.generationSettings.topK,
            },
            signal: controller.signal,
            parseAs: 'stream',
        })
        const responseIterable = responseToIterable(response)
        for await (const chunk of responseIterable) {
            const data = JSON.parse(chunk.data)
            if (chunk.event === 'message') {
                generatedResponse.value += data.text
            } else if (chunk.event === 'final') {
                generatedResponse.value = currentInput.value + data.text
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

const continueMessage = async () => {
    // TODO implement
    toast.warning('TODO: Not implemented yet')
}
</script>

<template>
    <div class="flex flex-row flex-grow">
        <!-- Input -->
        <div class="flex flex-col flex-grow p-2">
            <textarea
                class="textarea textarea-bordered flex-grow text-base focus:outline-none focus:border-secondary border-2"
                placeholder="Instruct mode"
                :disabled="pendingMessage"
                v-model="currentInput" />

            <div class="flex flex-row justify-between mt-3">
                <button
                    @click="getGeneration"
                    :disabled="pendingMessage || connectionStore.connected === false"
                    class="btn btn-primary w-[30%]">
                    {{ pendingMessage ? '' : 'Generate' }}
                    <span class="loading loading-spinner loading-md" :class="{hidden: !pendingMessage}" />
                </button>
                <button @click="stop" :disabled="!pendingMessage" class="btn btn-primary w-[30%]">Stop</button>
                <button
                    @click="continueMessage"
                    :disabled="pendingMessage || connectionStore.connected === false"
                    class="btn btn-primary w-[30%]">
                    Continue
                </button>
            </div>
        </div>

        <!-- Output -->
        <div class="flex flex-col p-2">
            <textarea
                class="textarea textarea-bordered flex-grow text-base focus:outline-none focus:border-secondary border-2"
                v-model="generatedResponse" />
        </div>
    </div>
</template>
