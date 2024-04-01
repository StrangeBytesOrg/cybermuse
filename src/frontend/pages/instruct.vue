<script lang="ts" setup>
import {ref} from 'vue'
import {useConnectionStore, useSettingsStore} from '../store'
import {client} from '../api-client'
import {responseToIterable} from '../lib/fetch-backend'
import {createPrompt} from '../lib/format-prompt'
import {useToast} from 'vue-toastification'

const connectionStore = useConnectionStore()
const settingsStore = useSettingsStore()
const pendingMessage = ref(false)
const currentInput = ref('')
const systemPrompt = ref('')
const generatedResponse = ref('')
const promptSyntax = ref('none')
const toast = useToast()
let controller: AbortController

const getGeneration = async () => {
    pendingMessage.value = true
    generatedResponse.value = ''
    controller = new AbortController()

    // TODO prompt syntax formatting needs to be more modular
    let prompt = ''
    if (promptSyntax.value === 'chatml') {
        if (systemPrompt.value) {
            prompt += createPrompt([{text: systemPrompt.value, userType: 'system'}])
        }
        prompt += createPrompt([{text: currentInput.value, userType: 'user'}])
        prompt += `<|im_start|>assistant\n`
    } else {
        prompt = currentInput.value
    }
    console.log(`Prompt: ${prompt}`)

    try {
        const {response} = await client.POST('/api/generate-stream', {
            body: {
                prompt,
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
                generatedResponse.value = data.text
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
    pendingMessage.value = true
    controller = new AbortController()

    let prompt = ''
    if (promptSyntax.value === 'chatml') {
        if (systemPrompt.value) {
            prompt += createPrompt([{text: systemPrompt.value, userType: 'system'}])
        }
        prompt += createPrompt([{text: currentInput.value, userType: 'user'}])
        prompt += `<|im_start|>assistant\n`
        prompt += generatedResponse.value
    } else {
        prompt = currentInput.value
    }
    console.log(`Prompt: ${prompt}`)

    try {
        const {response} = await client.POST('/api/generate-stream', {
            body: {
                prompt,
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
                // generatedResponse.value = data.text
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
</script>

<template>
    <div class="flex flex-row flex-grow">
        <!-- Input -->
        <div class="flex flex-col flex-grow w-1/2 p-2">
            <textarea
                v-show="promptSyntax === 'chatml'"
                class="textarea textarea-bordered flex-grow text-base focus:outline-none focus:border-secondary border-2"
                placeholder="System Prompt"
                v-model="systemPrompt" />
            <textarea
                class="textarea textarea-bordered flex-grow text-base focus:outline-none focus:border-secondary border-2"
                placeholder="Instruction"
                @keydown.ctrl.enter="getGeneration"
                :disabled="pendingMessage"
                v-model="currentInput" />

            <div class="flex flex-col">
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
                <div class="flex flex-row mt-2">
                    <label class="label w-1/2">Prompt Syntax</label>
                    <select class="select select-bordered w-1/2 ml-3" v-model="promptSyntax">
                        <option value="none">none</option>
                        <option value="chatml">ChatML</option>
                    </select>
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
