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

    <div class="flex flex-col bg-base-200 rounded-lg p-3 pt-0 m-2">
        <label class="form-control w-full">
            <div class="label">
                <span class="label-text">Template Name</span>
            </div>
            <input
                type="text"
                v-model="template.name"
                class="input input-bordered mb-auto mr-5 max-w-80 border-2 focus:outline-none focus:border-primary" />
        </label>
        <div class="flex flex-col w-full">
            <label class="form-control w-full">
                <div class="label">
                    <span class="label-text">Template</span>
                </div>
                <textarea
                    v-model="template.template"
                    @input="resizeTextarea"
                    class="textarea textarea-bordered leading-normal p-2 focus:outline-none focus:border-primary" />
            </label>
        </div>

        <div class="flex flex-row space-x-2 mt-2">
            <button @click="getPreview" class="btn btn-neutral flex-grow">Preview</button>
            <button @click="createTemplate" class="btn btn-primary flex-grow">Create Template</button>
        </div>
    </div>

    <div v-if="example" class="flex w-full bg-base-200 rounded-lg p-3 m-2 whitespace-pre-wrap">
        {{ example }}
    </div>
</template>
