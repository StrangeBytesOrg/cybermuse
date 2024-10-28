<script lang="ts" setup>
import {ref, computed, onMounted} from 'vue'
import {useToast} from 'vue-toastification'
import {client} from '../api-client'

const toast = useToast()
const res = await client.templates.getAll.query()
const templates = ref(res.templates)
const selectedTemplate = ref(res.activeTemplateId)
const example = ref('')

const activeTemplate = computed(() => {
    const missingTemplate = {id: 0, name: '', template: ''}
    return templates.value?.find((template) => template.id === selectedTemplate.value) || missingTemplate
})

const setActiveTemplate = async () => {
    example.value = ''

    if (!selectedTemplate.value) {
        toast.error('No template selected')
        return
    }

    await client.templates.setActiveId.mutate({id: selectedTemplate.value})
    document.querySelectorAll('textarea').forEach((textarea) => {
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight + 4}px`
    })
}

const updateTemplate = async () => {
    await client.templates.update.mutate({
        id: activeTemplate.value.id,
        name: activeTemplate.value.name,
        template: activeTemplate.value.template,
    })
    toast.success('Template updated')
}

const deleteTemplate = async () => {
    await client.templates.delete.mutate({id: activeTemplate.value.id})
    toast.success('Template deleted')
    templates.value.splice(
        templates.value?.findIndex((template) => template.id === activeTemplate.value.id),
        1,
    )
    selectedTemplate.value = 1
}

const getPreview = async () => {
    const characters = [
        {name: 'Alice', description: 'A character named Alice.'},
        {name: 'Bob', description: 'A character named Bob.'},
    ]
    const lore = [{name: 'Example', content: 'This would be the text for a lore entry.'}]

    example.value = await client.templates.parseTemplate.query({
        template: activeTemplate.value.template,
        characters,
        lore,
    })
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

            <div class="flex flex-col w-full">
                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Template</span>
                    </div>
                    <textarea
                        v-model="activeTemplate.template"
                        @input="resizeTextarea"
                        class="textarea textarea-bordered leading-normal p-2 focus:outline-none focus:border-primary" />
                </label>
            </div>

            <div class="flex flex-row space-x-2 mt-3">
                <button @click="updateTemplate" class="btn btn-primary flex-grow">Save</button>
                <button @click="getPreview" class="btn btn-neutral flex-grow">Preview</button>
                <button @click="deleteTemplate()" class="btn btn-error flex-grow">Delete</button>
            </div>
        </div>

        <div class="w-full" v-if="example">
            <div class="flex w-full bg-base-200 rounded-lg p-3 mt-3 whitespace-pre-wrap">{{ example }}</div>
        </div>
    </div>
</template>
