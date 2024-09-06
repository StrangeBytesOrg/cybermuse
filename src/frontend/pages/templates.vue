<script lang="ts" setup>
import {ref, computed, onMounted} from 'vue'
import {useToast} from 'vue-toastification'
import {client} from '../api-client'

const toast = useToast()
const {data, error} = await client.GET('/templates')
if (error) {
    toast.error(`Error fetching templates: ${error.message}`)
}

const templates = ref(data?.templates || [])
const selectedTemplate = ref(data?.activeTemplateId || 0)
const exampleChat = ref('')
const exampleInstruct = ref('')

const activeTemplate = computed(() => {
    const missingTemplate = {id: 0, name: '', instructTemplate: '', chatTemplate: '', chatInstruction: ''}
    return templates.value?.find((template) => template.id === selectedTemplate.value) || missingTemplate
})

const setActiveTemplate = async () => {
    exampleChat.value = ''
    exampleInstruct.value = ''

    if (!selectedTemplate.value) {
        toast.error('No template selected')
        return
    }

    const {error} = await client.POST('/set-active-template/{id}', {
        params: {path: {id: String(selectedTemplate.value)}},
    })
    if (error) {
        console.error(error)
        toast.error('Error setting active template')
    } else {
        toast.success('Active template set')
        document.querySelectorAll('textarea').forEach((textarea) => {
            textarea.style.height = 'auto'
            textarea.style.height = `${textarea.scrollHeight + 4}px`
        })
    }
}

const updateTemplate = async () => {
    const {error} = await client.POST('/update-template/{id}', {
        params: {path: {id: String(activeTemplate.value.id)}},
        body: {
            name: activeTemplate.value.name,
            instructTemplate: activeTemplate.value.instructTemplate,
            chatTemplate: activeTemplate.value.chatTemplate,
            chatInstruction: activeTemplate.value.chatInstruction,
        },
    })
    if (error) {
        console.error(error)
        toast.error('Error updating template')
    } else {
        toast.success('Template updated')
    }
}

const deleteTemplate = async () => {
    const {error} = await client.POST('/delete-template/{id}', {
        params: {path: {id: String(activeTemplate.value.id)}},
    })
    if (error) {
        console.error(error)
        toast.error(`Error deleting template\n${error.message}`)
        return
    } else {
        toast.success('Template deleted')
        templates.value.splice(
            templates.value?.findIndex((template) => template.id === activeTemplate.value.id),
            1,
        )
        selectedTemplate.value = 1
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
    const lore = [{name: 'Example', content: 'This would be the text for a lore entry.'}]
    const instructMessages = [{text: 'What is the capital of France?', role: 'user'}]

    const {data, error} = await client.POST('/parse-template', {
        body: {
            chatTemplate: activeTemplate.value.chatTemplate,
            instructTemplate: activeTemplate.value.instructTemplate,
            chatInstruction: activeTemplate.value.chatInstruction,
            characters,
            messages,
            lore,
            instructMessages,
        },
    })
    if (error || !data) {
        toast.error(`Error parsing template: ${error.message}`)
        return
    }
    exampleChat.value = data?.chatExample || ''
    exampleInstruct.value = data?.instructExample || ''
}

const resizeTextarea = async (event: Event) => {
    const textarea = event.target as HTMLTextAreaElement
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight + 4}px`
}

onMounted(() => {
    document.querySelectorAll('textarea').forEach((textarea) => {
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight + 4}px`
    })
})
</script>

<template>
    <div class="py-3 px-2">
        <div class="flex flex-row">
            <div class="flex flex-col">
                <select v-model="selectedTemplate" @change="setActiveTemplate" class="select select-bordered min-w-60">
                    <option v-for="template in templates" :key="template.id" :value="template.id">
                        {{ template.name }}
                    </option>
                </select>
            </div>

            <router-link to="/create-template" class="btn btn-primary mt-auto ml-3">Create Template</router-link>
        </div>

        <div class="flex flex-col bg-base-200 rounded-lg p-3 pt-1 mt-3">
            <label class="form-control w-full">
                <div class="label">
                    <span class="label-text">Template Name</span>
                </div>
                <input
                    type="text"
                    v-model="activeTemplate.name"
                    class="input input-bordered mb-auto mr-5 max-w-80 border-2 focus:outline-none focus:border-primary" />
            </label>

            <div class="flex w-full flex-col md:flex-row md:space-x-5">
                <!-- Chat -->
                <div class="flex flex-col w-full">
                    <label class="form-control w-full">
                        <div class="label">
                            <span class="label-text">Chat Template</span>
                        </div>
                        <textarea
                            v-model="activeTemplate.chatTemplate"
                            @input="resizeTextarea"
                            class="textarea textarea-bordered leading-normal p-2 focus:outline-none focus:border-primary" />
                    </label>

                    <label class="form-control w-full">
                        <div class="label">
                            <span class="label-text">Chat Instruction</span>
                        </div>
                        <textarea
                            v-model="activeTemplate.chatInstruction"
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
                            v-model="activeTemplate.instructTemplate"
                            @input="resizeTextarea"
                            class="textarea textarea-bordered leading-normal p-2 focus:outline-none focus:border-primary" />
                    </label>
                </div>
            </div>

            <div class="flex flex-row space-x-2 mt-3">
                <button @click="updateTemplate" class="btn btn-primary flex-grow">Save</button>
                <button @click="getPreview" class="btn btn-neutral flex-grow">Preview</button>
                <button @click="deleteTemplate()" class="btn btn-error flex-grow">Delete</button>
            </div>
        </div>

        <div class="flex flex-col md:flex-row md:space-x-5 mt-5">
            <div class="w-full" v-if="exampleChat">
                <div class="text-lg">Chat Prompt Example</div>
                <div class="flex w-full bg-base-200 rounded-lg p-3 mt-2 whitespace-pre-wrap">{{ exampleChat }}</div>
            </div>
            <div class="w-full" v-if="exampleInstruct">
                <div class="text-lg">Instruct Prompt Example</div>
                <div class="flex w-full bg-base-200 rounded-lg p-3 mt-2 whitespace-pre-wrap">{{ exampleInstruct }}</div>
            </div>
        </div>
    </div>
</template>
