<script lang="ts" setup>
import {ref, computed} from 'vue'
import {useRouter} from 'vue-router'
import {useToast} from 'vue-toastification'
import {Template} from '@huggingface/jinja'
import {client} from '../api-client'

const toast = useToast()
const router = useRouter()
const templateName = ref('')
const templateContent = ref('')
const instruction = ref('')

const characters = [
    {name: 'Alice', description: 'A character named Alice.'},
    {name: 'Bob', description: 'A character named Bob.'},
]

const exampleOutput = computed(() => {
    let parsed = ''
    try {
        const template = new Template(templateContent.value)
        parsed = template.render({
            characters: characters,
            messages: [
                {text: 'Hello', generated: false, role: 'user', character: characters[0]},
                {text: 'Hi, how are you?', generated: true, role: 'assistant', character: characters[1]},
                {text: 'Great, thanks for asking.', generated: false, role: 'user', character: characters[0]},
            ],
            char: characters[0]?.name,
            user: characters[1]?.name,
        })
    } catch (err) {
        parsed = `Error parsing template\n${err}`
    }
    return parsed.replace(/\n/g, '<br>')
})

const createTemplate = async () => {
    const {error} = await client.POST('/create-template', {
        body: {
            name: templateName.value,
            content: templateContent.value,
            instruction: instruction.value,
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
        <label class="form-control w-full">
            <div class="label">
                <span class="label-text">Template String</span>
            </div>
            <textarea
                v-model="templateContent"
                @input="resizeTextarea"
                class="textarea textarea-bordered leading-normal p-2 focus:outline-none focus:border-primary" />
        </label>
        <label class="form-control w-full">
            <div class="label">
                <span class="label-text">Instruction</span>
            </div>
            <textarea
                v-model="instruction"
                @input="resizeTextarea"
                class="textarea textarea-bordered leading-normal p-2 focus:outline-none focus:border-primary" />
        </label>

        <div class="flex flex-row space-x-2 mt-2">
            <button @click="createTemplate" class="btn btn-primary flex-grow">Create Template</button>
        </div>
    </div>

    <div class="bg-base-200 rounded-lg p-3 m-2" v-if="exampleOutput" v-html="exampleOutput"></div>
</template>
