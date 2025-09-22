<script lang="ts" setup>
import {ref, computed, reactive} from 'vue'
import {Liquid} from 'liquidjs'
import {useToastStore, useSettingsStore} from '@/store'
import {templateCollection} from '@/db'
import Editable from '@/components/editable.vue'

const toast = useToastStore()
const settings = useSettingsStore()
let templates = reactive(await templateCollection.toArray())
const example = ref('')
const createMode = ref(false)
const newTemplate = reactive({
    name: '',
    template: '',
})

const activeTemplate = computed(() => {
    return templates.find((template) => template.id === settings.template)
})

const currentTemplate = computed(() => {
    return createMode.value ? newTemplate : activeTemplate.value
})

const setActiveTemplate = async (event: Event) => {
    const target = event.target as HTMLSelectElement
    settings.template = target.value
    toast.success('Active template set')
}

const createTemplate = async () => {
    const templateId = newTemplate.name.toLowerCase().replace(/ /g, '-')
    await templateCollection.put({
        id: templateId,
        lastUpdate: Date.now(),
        ...newTemplate,
    })
    templates = reactive(await templateCollection.toArray())
    settings.template = templateId
    createMode.value = false
    toast.success('Created new template')
}

const validateTemplate = () => {
    if (!activeTemplate.value) throw new Error('Template not found')
    const engine = new Liquid()
    try {
        engine.parse(activeTemplate.value.template)
    } catch (error) {
        console.error(error)
        throw new Error('Template contains an error')
    }
}

const updateTemplate = async () => {
    validateTemplate()
    if (!activeTemplate.value) throw new Error('Template not set')
    await templateCollection.put(activeTemplate.value)
    toast.success('Template updated')
}

const deleteTemplate = async () => {
    if (activeTemplate.value?.id === 'default-template') {
        throw new Error('Cannot delete the default template')
    }

    if (activeTemplate.value) {
        await templateCollection.delete(activeTemplate.value.id)
        templates = reactive(await templateCollection.toArray())
        settings.template = 'default-template'
        toast.success('Template deleted')
    }
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

    if (!activeTemplate.value) {
        throw new Error('Template not found')
    }

    const characterString = characters.map((character) => `${character.name}: ${character.description}`).join('\n')

    let loreString = ''
    lore.forEach((book) => {
        loreString += `${book.name}\n`
        book.entries.forEach((entry) => {
            loreString += `${entry.name}: ${entry.content}\n`
        })
    })

    const engine = new Liquid()
    const templateString = currentTemplate.value?.template ?? ''
    example.value = await engine.parseAndRender(templateString, {
        characters: characterString,
        lore: loreString ?? undefined,
    })
}
</script>

<template>
    <div class="flex flex-row gap-x-2 px-1 md:px-0 w-full">
        <select @change="setActiveTemplate" :value="settings.template" class="select flex-1 flex-grow">
            <option v-for="template in templates" :key="template.id" :value="template.id">
                {{ template.name }}
            </option>
        </select>

        <button @click="createMode = !createMode" :class="['btn', createMode ? 'btn-primary' : 'btn-success']">
            {{ createMode ? 'Cancel' : '+ Create Template' }}
        </button>
    </div>

    <fieldset v-if="currentTemplate" class="fieldset flex flex-col bg-base-200 rounded-lg p-3 mt-2 w-full">
        <label class="label text-sm">Template Name</label>
        <input v-model="currentTemplate.name" type="text" class="input" />

        <label class="label text-sm">Template</label>
        <Editable
            v-model="currentTemplate.template"
            editable="plaintext-only"
            class="textarea w-full max-h-96 overflow-y-scroll whitespace-pre-wrap p-2"
        />

        <div class="flex flex-row space-x-2 mt-3">
            <button v-if="createMode" @click="createTemplate" class="btn btn-primary flex-grow">Create</button>
            <button v-else @click="updateTemplate" class="btn btn-primary flex-grow">Save</button>
            <button @click="getPreview" class="btn flex-grow">Preview</button>
            <button v-if="!createMode" @click="deleteTemplate" class="btn btn-error flex-grow">Delete</button>
        </div>
    </fieldset>

    <div v-else class="mt-3">Template Not Found</div>

    <div class="w-full" v-if="example">
        <div class="flex w-full bg-base-200 rounded-lg p-3 mt-3 whitespace-pre-wrap">{{ example }}</div>
    </div>
</template>
