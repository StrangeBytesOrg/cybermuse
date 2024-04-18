<script lang="ts" setup>
import {ref, computed, onMounted} from 'vue'
import {useToast} from 'vue-toastification'
import {client} from '../api-client'
import {Template} from '@huggingface/jinja'

const toast = useToast()
const instruction = ref('')
const promptTemplate = ref('')

const {data} = await client.GET('/api/get-settings')
instruction.value = data?.instruction || ''
promptTemplate.value = data?.promptTemplate || ''

// Some sample data for the example output
const characters = [
    {name: 'Bob', description: 'Bob is participant 2 in this conversation', type: 'user'},
    {name: 'Alice', description: '{{char}} is participant 1 in this conversation', type: 'character'},
]
const exampleMessages = [
    {text: 'How are you?', character: characters[0]},
    {text: "I'm well, thanks", character: characters[1]},
    {text: 'What are you up to?', character: characters[0]},
]

const saveSettings = async () => {
    const {error} = await client.POST('/api/set-settings', {
        body: {
            instruction: instruction.value,
            promptTemplate: promptTemplate.value,
        },
    })
    if (error) {
        console.error(error)
        toast.error('Failed to save settings')
    } else {
        toast.success('Settings saved')
    }
}

const exampleOutput = computed(() => {
    let parsed = '...'
    characters.forEach((character) => {
        const descriptionTemplate = new Template(character.description)
        character.description = descriptionTemplate.render({char: character.name})
    })
    try {
        const instructionTemplate = new Template(instruction.value)
        const parsedInstruction = instructionTemplate.render({characters})
        const template = new Template(promptTemplate.value)
        parsed = template.render({
            messages: exampleMessages,
            characters,
            instruction: parsedInstruction,
        })
    } catch (err) {
        parsed = String(err)
    }
    return parsed.replace(/\n/g, '<br>')
})

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
    <div class="p-2">
        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">Prompt Preset</span>
            </div>
            <select class="select select-bordered">
                <option value="custom">ChatML</option>
            </select>
        </label>

        <div class="bg-base-200 rounded-lg px-2 pb-3 mt-3">
            <!-- Prompt Settings -->
            <div class="flex flex-col flex-grow">
                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Instruction</span>
                    </div>
                    <textarea
                        v-model="instruction"
                        @input="resizeTextarea"
                        class="textarea textarea-bordered leading-normal w-full min-h-20 p-2" />
                </label>
            </div>

            <label class="form-control w-full mt-2">
                <div class="label">
                    <span class="label-text">Prompt Syntax</span>
                </div>
                <textarea
                    v-model="promptTemplate"
                    @input="resizeTextarea"
                    class="textarea textarea-bordered leading-normal w-full min-h-24 p-2" />
            </label>
        </div>

        <div class="bg-base-200 rounded-lg p-2 mt-3">
            <p class="text-lg">Example</p>
            <div class="text-sm text-gray-500" v-html="exampleOutput"></div>
        </div>

        <button class="btn btn-primary mt-9" @click="saveSettings">Save</button>
    </div>
</template>
