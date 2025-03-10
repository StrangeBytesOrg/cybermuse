<script lang="ts" setup>
import {ref, reactive, computed} from 'vue'
import Handlebars from 'handlebars'
import {useToastStore} from '@/store'
import {db} from '@/db'
import Editable from '@/components/editable.vue'

const toast = useToastStore()
let templates = reactive(await db.templates.toArray())
let user = reactive(await db.users.get('default-user'))
const example = ref('')

const selectedTemplate = ref(user.promptTemplateId)
const activeTemplate = computed(() => {
    return templates.find((t) => t.id === selectedTemplate.value)
})

const setActiveTemplate = async () => {
    example.value = ''
    if (await db.templates.get(selectedTemplate.value)) {
        await db.users.update('default-user', {promptTemplateId: selectedTemplate.value})
    }
}

const updateTemplate = async () => {
    if (activeTemplate.value) {
        await db.templates.update(activeTemplate.value.id, activeTemplate.value)
    }
    toast.success('Template updated')
}

const deleteTemplate = async () => {
    if (activeTemplate.value?.id === 'default-template') {
        throw new Error('Cannot delete the default template')
    }

    if (activeTemplate.value) {
        await db.templates.delete(activeTemplate.value.id)
        // Set the default template as active
        selectedTemplate.value = 'default-template'
        await db.users.update('default-user', {promptTemplateId: 'default-template'})
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

    const hbTemplate = Handlebars.compile(activeTemplate.value.template)
    example.value = hbTemplate({
        characters: characterString,
        lore: loreString,
    })
}
</script>

<template>
    <main class="">
        <div class="flex flex-row">
            <div class="flex flex-col">
                <select v-model="selectedTemplate" @change="setActiveTemplate" class="select min-w-60">
                    <option v-for="template in templates" :key="template.id" :value="template.id">
                        {{ template.name }}
                    </option>
                </select>
            </div>

            <router-link to="/create-template" class="btn btn-primary mt-auto ml-3">Create Template</router-link>
        </div>

        <fieldset v-if="activeTemplate" class="fieldset flex flex-col bg-base-200 rounded-lg p-3 pt-1 mt-3">
            <label class="label text-sm">Template Name</label>
            <input v-model="activeTemplate.name" type="text" class="input" />

            <label class="label text-sm mt-3">Template</label>
            <Editable
                v-model="activeTemplate.template"
                class="textarea w-full max-h-96 overflow-y-scroll whitespace-pre-wrap p-2"
            />

            <div class="flex flex-row space-x-2 mt-3">
                <button @click="updateTemplate" class="btn btn-primary flex-grow">Save</button>
                <button @click="getPreview" class="btn btn-neutral flex-grow">Preview</button>
                <button @click="deleteTemplate" class="btn btn-error flex-grow">Delete</button>
            </div>
        </fieldset>

        <div class="w-full" v-if="example">
            <div class="flex w-full bg-base-200 rounded-lg p-3 mt-3 whitespace-pre-wrap">{{ example }}</div>
        </div>
    </main>
</template>
