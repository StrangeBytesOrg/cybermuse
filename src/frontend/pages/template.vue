<script lang="ts" setup>
import {ref, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useToast} from 'vue-toastification'
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
const exampleOutput = ref('')

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
        toast.error(`Error updating template\n${error.detail}`)
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

const testTemplate = async () => {
    const {data, error} = await client.POST('/parse-template', {
        body: {
            templateString: templateContent.value,
        },
    })
    if (error) {
        console.error(error.detail)
        exampleOutput.value = 'Error parsing template'
        exampleOutput.value += '\n' + error.detail
        return
    }

    exampleOutput.value = data?.parsed.replace(/\n/g, '<br>') || ''
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
            <button @click="testTemplate" class="btn btn-primary flex-grow">Test Template</button>
            <button @click="deleteTemplate(templateId)" class="btn btn-error flex-grow">Delete</button>
        </div>
    </div>

    <div class="bg-base-200 rounded-lg p-3 m-2" v-if="exampleOutput" v-html="exampleOutput"></div>
</template>
