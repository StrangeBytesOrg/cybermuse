<script lang="ts" setup>
import {ref} from 'vue'
import {useModelStore} from '../store'
import {client, streamingClient} from '../api-client'
import {useToast} from 'vue-toastification'

const modelStore = useModelStore()
const pendingMessage = ref(false)
const currentInput = ref('')
// const systemPrompt = ref('')
const generatedResponse = ref('')
const toast = useToast()
let controller: AbortController

const getGeneration = async () => {
    controller = new AbortController()
    pendingMessage.value = true
    generatedResponse.value = ''
    console.log('NOT IMPLEMENTED')
}

const stop = async () => {
    console.log('Aborting generation')
    controller.abort('manual abort')
}
</script>

<template>
    <div class="flex flex-row min-h-[100vh]">
        <!-- Input -->
        <div class="flex flex-col flex-grow w-1/2 p-2">
            <!-- <textarea
                class="textarea textarea-bordered flex-grow text-base focus:outline-none focus:border-secondary border-2"
                placeholder="System Instruction"
                v-model="systemPrompt" /> -->
            <textarea
                class="textarea textarea-bordered mt-1 flex-grow text-base focus:outline-none focus:border-secondary border-2"
                placeholder="Prompt"
                @keydown.ctrl.enter="getGeneration"
                :disabled="pendingMessage"
                v-model="currentInput" />

            <div class="flex flex-col">
                <div class="flex flex-row justify-between mt-3">
                    <button
                        @click="getGeneration"
                        :disabled="pendingMessage || modelStore.loaded === false"
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
