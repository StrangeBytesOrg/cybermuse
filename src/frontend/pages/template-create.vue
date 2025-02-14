<script lang="ts" setup>
import {ref, reactive} from 'vue'
import {useRouter} from 'vue-router'
import {useToast} from 'vue-toastification'
import {Template} from '@huggingface/jinja'
import {templateCollection} from '@/db'
import TopBar from '@/components/top-bar.vue'

const toast = useToast()
const router = useRouter()
const example = ref('')
const template = reactive({
    name: '',
    template: '',
})

const createTemplate = async () => {
    await templateCollection.put(template)
    toast.success('Template created')
    router.push({name: 'templates'})
}

const getPreview = async () => {
    const characters = [
        {name: 'Alice', description: 'A character named Alice.'},
        {name: 'Bob', description: 'A character named Bob.'},
    ]
    const lore = [
        {
            name: 'Example Lorebook',
            entries: [{name: 'example', content: 'This would be the text for a lore entry.'}],
        },
    ]

    if (!template.template) {
        throw new Error('Template not found')
    }

    const jinjaTemplate = new Template(template.template)
    example.value = jinjaTemplate.render({characters, lore})
}

const resizeTextarea = async (event: Event) => {
    const textarea = event.target as HTMLTextAreaElement
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight + 4}px`
}
</script>

<template>
    <TopBar title="Create Template" back />

    <fieldset class="flex flex-col bg-base-200 rounded-lg p-3 pt-1 m-2">
        <label class="fieldset-label text-sm">Template Name</label>
        <input v-model="template.name" type="text" class="input focus:outline-none" />

        <label class="fieldset-label text-sm mt-3">Template</label>
        <textarea
            v-model="template.template"
            @input="resizeTextarea"
            class="textarea textarea-bordered leading-normal p-2 focus:outline-none" />

        <div class="flex flex-row space-x-2 mt-2">
            <button @click="getPreview" class="btn btn-neutral flex-grow">Preview</button>
            <button @click="createTemplate" class="btn btn-primary flex-grow">Create Template</button>
        </div>
    </fieldset>

    <div v-if="example" class="flex w-full bg-base-200 rounded-lg p-3 m-2 whitespace-pre-wrap">
        {{ example }}
    </div>
</template>
