<script lang="ts" setup>
import {ref, reactive} from 'vue'
import {useRouter} from 'vue-router'
import {Liquid} from 'liquidjs'
import {useToastStore, useSettingsStore} from '@/store'
import {templateCollection} from '@/db'
import Editable from '@/components/editable.vue'

const toast = useToastStore()
const settings = useSettingsStore()
const router = useRouter()
const example = ref('')
const template = reactive({
    name: '',
    template: '',
})

const validateTemplate = () => {
    const engine = new Liquid()
    try {
        engine.parse(template.template)
    } catch (error) {
        console.error(error)
        throw new Error('Template contains an error')
    }
}

const createTemplate = async () => {
    validateTemplate()
    const templateId = template.name.toLowerCase().replace(/\s/g, '-')
    await templateCollection.put({
        id: templateId,
        lastUpdate: Date.now(),
        ...template,
    })
    settings.setTemplate(templateId)
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

    let characterString = ''
    characters.forEach((character) => {
        characterString += `${character.name}: ${character.description}\n`
    })
    let loreString = ''
    lore.forEach((book) => {
        loreString += `${book.name}\n`
        book.entries.forEach((entry) => {
            loreString += `${entry.name}: ${entry.content}\n`
        })
    })

    const engine = new Liquid()
    example.value = engine.parseAndRenderSync(template.template, {
        characters: characterString,
        lore: loreString,
    })
}
</script>

<template>
    <fieldset class="flex flex-col bg-base-200 rounded-lg p-2">
        <label class="fieldset-label text-sm">Template Name</label>
        <input v-model="template.name" type="text" class="input" />

        <label class="fieldset-label text-sm mt-3">Template</label>
        <Editable
            v-model="template.template"
            class="textarea w-full max-h-96 overflow-y-scroll whitespace-pre-wrap p-2"
        />

        <div class="flex flex-row space-x-2 mt-2">
            <button @click="getPreview" class="btn btn-neutral flex-grow">Preview</button>
            <button @click="createTemplate" class="btn btn-primary flex-grow">Create Template</button>
        </div>
    </fieldset>

    <div v-if="example" class="flex w-full bg-base-200 rounded-lg p-3 mt-3 whitespace-pre-wrap">
        {{ example }}
    </div>
</template>
