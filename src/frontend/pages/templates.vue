<script lang="ts" setup>
import {ref, reactive, computed, onMounted} from 'vue'
import {useToast} from 'vue-toastification'
import {Template} from '@huggingface/jinja'
import {templateCollection, userCollection} from '@/db'
import TopBar from '@/components/top-bar.vue'

const toast = useToast()
let templates = reactive(await templateCollection.find())
let user = reactive(await userCollection.findById('default-user'))
const example = ref('')

const selectedTemplate = ref(user.promptTemplate)
const activeTemplate = computed(() => {
    return templates.find((t) => t._id === selectedTemplate.value)
})

const setActiveTemplate = async () => {
    example.value = ''

    // Check if the template exists
    await templateCollection.findById(selectedTemplate.value)

    user.promptTemplate = selectedTemplate.value
    await userCollection.update(user)
}

const updateTemplate = async () => {
    if (activeTemplate.value) {
        await templateCollection.update(activeTemplate.value)
    }

    toast.success('Template updated')
}

const deleteTemplate = async () => {
    if (activeTemplate.value?._id === 'default-template') {
        throw new Error('Cannot delete the default template')
    }

    if (activeTemplate.value) {
        await templateCollection.removeById(activeTemplate.value._id)
        // Set the default template as active
        user.promptTemplate = 'default-template'
        selectedTemplate.value = 'default-template'
        await userCollection.update(user)
        toast.success('Template deleted')
    }
}

const getPreview = async () => {
    const characters = [
        {name: 'Alice', description: 'A character named Alice.'},
        {name: 'Bob', description: 'A character named Bob.'},
    ]
    const lore = [{name: 'Example', content: 'This would be the text for a lore entry.'}]

    if (!activeTemplate.value) {
        throw new Error('Template not found')
    }

    const jinjaTemplate = new Template(activeTemplate.value.template)
    example.value = jinjaTemplate.render({characters, lore})
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
    <TopBar title="Prompt Templates" />
    <div class="py-3 px-2">
        <div class="flex flex-row">
            <div class="flex flex-col">
                <select v-model="selectedTemplate" @change="setActiveTemplate" class="select select-bordered min-w-60">
                    <option v-for="template in templates" :key="template._id" :value="template._id">
                        {{ template.name }}
                    </option>
                </select>
            </div>

            <router-link to="/create-template" class="btn btn-primary mt-auto ml-3">Create Template</router-link>
        </div>

        <div v-if="activeTemplate" class="flex flex-col bg-base-200 rounded-lg p-3 pt-1 mt-3">
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
        <div v-else>Template not found</div>

        <div class="w-full" v-if="example">
            <div class="flex w-full bg-base-200 rounded-lg p-3 mt-3 whitespace-pre-wrap">{{ example }}</div>
        </div>
    </div>
</template>
