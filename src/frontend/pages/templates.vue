<script lang="ts" setup>
import {ref, computed, reactive} from 'vue'
import {Liquid} from 'liquidjs'
import {useToastStore, useSettingsStore} from '@/store'
import {templateCollection} from '@/db'
import Editable from '@/components/editable.vue'

const toast = useToastStore()
const settings = useSettingsStore()
const templates = reactive(await templateCollection.toArray())
const example = ref('')

const activeTemplate = computed(() => {
    return templates.find((template) => template.id === settings.template)
})

const setActiveTemplate = async (event: Event) => {
    const target = event.target as HTMLSelectElement
    settings.setTemplate(target.value)
    toast.success('Active template set')
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
        settings.setTemplate('default-template')
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
    example.value = await engine.parseAndRender(activeTemplate.value.template, {
        characters: characterString,
        lore: loreString ?? undefined,
    })
}
</script>

<template>
    <div class="flex flex-row">
        <div class="flex flex-col">
            <select @change="setActiveTemplate" :value="settings.template" class="select min-w-60">
                <option v-for="template in templates" :key="template.id" :value="template.id">
                    {{ template.name }}
                </option>
            </select>
        </div>

        <router-link :to="{name: 'create-template'}" class="btn btn-primary mt-auto ml-3">Create Template</router-link>
    </div>

    <fieldset v-if="activeTemplate" class="fieldset flex flex-col bg-base-200 rounded-lg p-3 pt-1 mt-3">
        <label class="label text-sm">Template Name</label>
        <input v-model="activeTemplate.name" type="text" class="input" />

        <label class="label text-sm mt-3">Template</label>
        <Editable
            v-model="activeTemplate.template"
            editable="plaintext-only"
            class="textarea w-full max-h-96 overflow-y-scroll whitespace-pre-wrap p-2"
        />

        <div class="flex flex-row space-x-2 mt-3">
            <button @click="updateTemplate" class="btn btn-primary flex-grow">Save</button>
            <button @click="getPreview" class="btn flex-grow">Preview</button>
            <button @click="deleteTemplate" class="btn btn-error flex-grow">Delete</button>
        </div>
    </fieldset>
    <div v-else class="mt-3">Template Not Found</div>

    <div class="w-full" v-if="example">
        <div class="flex w-full bg-base-200 rounded-lg p-3 mt-3 whitespace-pre-wrap">{{ example }}</div>
    </div>
</template>
