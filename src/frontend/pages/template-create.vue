<script lang="ts" setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {useToast} from 'vue-toastification'
import {client} from '../api-client'

const toast = useToast()
const router = useRouter()
const templateName = ref('')
const instructTemplate = ref('')
const chatTemplate = ref('')
const chatInstruction = ref('')
const exampleChat = ref('')
const exampleInstruct = ref('')

const createTemplate = async () => {
    const {error} = await client.POST('/create-template', {
        body: {
            name: templateName.value,
            instructTemplate: instructTemplate.value,
            chatTemplate: chatTemplate.value,
            chatInstruction: chatInstruction.value,
        },
    })
    if (error) {
        toast.error(`Error creating template\n${error.message}`)
        console.error(error)
    } else {
        toast.success('Template created')
        router.push('/templates')
    }
}

const getPreview = async () => {
    const characters = [
        {name: 'Alice', description: 'A character named Alice.'},
        {name: 'Bob', description: 'A character named Bob.'},
    ]
    const messages = [
        {text: 'Hello', generated: false, role: 'user', character: characters[0]},
        {text: 'Hi, how are you {{user}}?', generated: true, role: 'assistant', character: characters[1]},
        {text: 'Great, thanks for asking.', generated: false, role: 'user', character: characters[0]},
        // {text: '', generated: true, role: 'assistant', character: characters[1]},
    ]
    const instructMessages = [{text: 'What is the capital of France?', role: 'user'}]

    const {data, error} = await client.POST('/parse-template', {
        body: {
            instructTemplate: instructTemplate.value,
            chatTemplate: chatTemplate.value,
            chatInstruction: chatInstruction.value,
            characters,
            messages,
            instructMessages,
        },
    })
    if (error) {
        toast.error(`Error parsing template: ${error.message}`)
    }
    exampleChat.value = data?.chatExample.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') || ''
    exampleInstruct.value =
        data?.instructExample.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') || ''
}

const resizeTextarea = async (event: Event) => {
    const textarea = event.target as HTMLTextAreaElement
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight + 4}px`
}
</script>

<template>
    <div class="flex flex-col bg-base-200 rounded-lg p-3 m-2">
        <label class="form-control w-full">
            <div class="label">
                <span class="label-text">Template Name</span>
            </div>
            <input
                type="text"
                v-model="templateName"
                class="input input-bordered mb-auto mr-5 max-w-80 border-2 focus:outline-none focus:border-primary" />
        </label>
        <div class="flex flex-row w-full space-x-5">
            <!-- Chat -->
            <div class="flex flex-col w-full">
                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Chat Template</span>
                    </div>
                    <textarea
                        v-model="chatTemplate"
                        @input="resizeTextarea"
                        class="textarea textarea-bordered leading-normal p-2 focus:outline-none focus:border-primary" />
                </label>
                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Chat Instruction</span>
                    </div>
                    <textarea
                        v-model="chatInstruction"
                        @input="resizeTextarea"
                        class="textarea textarea-bordered leading-normal p-2 focus:outline-none focus:border-primary" />
                </label>
            </div>

            <!-- Instruct -->
            <div class="flex flex-col w-full">
                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Instruction Template</span>
                    </div>
                    <textarea
                        v-model="instructTemplate"
                        @input="resizeTextarea"
                        class="textarea textarea-bordered leading-normal p-2 focus:outline-none focus:border-primary" />
                </label>
            </div>
        </div>

        <div class="flex flex-row space-x-2 mt-2">
            <button @click="getPreview" class="btn btn-neutral flex-grow">Preview</button>
            <button @click="createTemplate" class="btn btn-primary flex-grow">Create Template</button>
        </div>
    </div>

    <div class="flex flex-row space-x-5">
        <div v-if="exampleChat" v-html="exampleChat" class="flex w-full bg-base-200 rounded-lg p-3 mt-2"></div>
        <div v-if="exampleInstruct" v-html="exampleInstruct" class="flex w-full bg-base-200 rounded-lg p-3 mt-2"></div>
    </div>
</template>
