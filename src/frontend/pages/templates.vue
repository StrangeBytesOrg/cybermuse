<script lang="ts" setup>
import {ref} from 'vue'
import {useToast} from 'vue-toastification'
import {client} from '../api-client'

const toast = useToast()
const {data} = await client.GET('/templates')

const templates = ref(data?.templates) || ref([])
const selectedTemplate = ref(data?.templates?.find((template) => template.active)?.id || 0)

const setActiveTemplate = async () => {
    if (!selectedTemplate.value) {
        toast.error('No template selected')
        return
    }

    const {error} = await client.POST('/set-active-template/{id}', {
        params: {path: {id: String(selectedTemplate.value)}},
    })
    if (error) {
        console.error(error)
        toast.error('Error setting active template')
    } else {
        toast.success('Active template set')
    }
}
</script>

<template>
    <div class="p-2">
        <div class="flex flex-row">
            <div class="flex flex-col">
                <h2 class="text-md">Active Template</h2>
                <select v-model="selectedTemplate" @change="setActiveTemplate" class="select select-bordered">
                    <option v-for="template in templates" :key="template.id" :value="template.id">
                        {{ template.name }}
                    </option>
                </select>
            </div>

            <router-link to="/create-template" class="btn btn-primary mt-auto ml-3">Create Template</router-link>
        </div>

        <div class="flex flex-col">
            <div v-for="template in templates" :key="template.id" class="flex flex-row bg-base-200 rounded-lg p-2 mt-2">
                <h3 class="text-lg font-bold">{{ template.name }}</h3>
                <div class="ml-auto">
                    <router-link :to="`template/${template.id}`" class="btn btn-neutral ml-2">Edit</router-link>
                </div>
            </div>
        </div>
    </div>
</template>
