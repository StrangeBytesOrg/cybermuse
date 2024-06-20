<script lang="ts" setup>
import {ref, onMounted, computed} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useToast} from 'vue-toastification'
import {Template} from '@huggingface/jinja'
import {client} from '../api-client'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const templateId = Number(route.params.id)

const {data} = await client.GET('/template/{id}', {
    params: {path: {id: String(templateId)}},
})
const templateName = ref(data?.template.name || '')
const templateContent = ref(data?.template.content || '')

const characters = [
    {name: 'Alice', description: 'A character named Alice.'},
    {name: 'Bob', description: 'A character named Bob.'},
]

const exampleOutput = computed(() => {
    let parsed = ''
    try {
        console.log(`|${templateContent.value}|`)
        const template = new Template(templateContent.value)
        parsed = template.render({
            characters: characters,
            messages: [
                {text: 'Hello', generated: false, role: 'user', character: characters[0]},
                {text: 'Hi, how are you?', generated: true, role: 'assistant', character: characters[1]},
                {text: 'Great, thanks for asking.', generated: false, role: 'user', character: characters[0]},
                {text: '', generated: true, role: 'assistant', character: characters[1]},
            ],
            char: characters[0]?.name,
        })
        console.log(`|${parsed}|`)
    } catch (err) {
        parsed = `Error parsing template\n${err}`
    }
    return parsed.replace(/\n/g, '<br>')
})

const updateTemplate = async () => {
    const {error} = await client.POST('/update-template/{id}', {
        params: {path: {id: String(templateId)}},
        body: {
            name: templateName.value,
            content: templateContent.value,
        },
    })
    if (error) {
        console.error(error)
        toast.error('Error updating template')
    } else {
        toast.success('Template updated')
        router.push('/templates')
    }
}

const deleteTemplate = async (id: number) => {
    const {error} = await client.POST('/delete-template/{id}', {
        params: {path: {id: String(id)}},
    })
    if (error) {
        console.error(error)
        toast.error('Error deleting template')
        return
    } else {
        router.push('/templates')
    }
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
        <label class="form-control w-full">
            <div class="label">
                <span class="label-text">Template String</span>
            </div>
            <textarea
                v-model="templateContent"
                @input="resizeTextarea"
                class="textarea textarea-bordered leading-normal p-2 focus:outline-none focus:border-primary" />
        </label>

        <div class="flex flex-row space-x-2 mt-2">
            <button @click="updateTemplate" class="btn btn-primary flex-grow">Save</button>
            <button @click="deleteTemplate(templateId)" class="btn btn-error flex-grow">Delete</button>
        </div>
    </div>

    <div class="bg-base-200 rounded-lg p-3 m-2" v-if="exampleOutput" v-html="exampleOutput"></div>
</template>
