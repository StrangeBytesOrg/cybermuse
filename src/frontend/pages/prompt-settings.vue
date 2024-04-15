<script lang="ts" setup>
import {ref} from 'vue'
import {useToast} from 'vue-toastification'
import {client} from '../api-client'

const toast = useToast()
const systemPrompt = ref('')
const promptTemplate = ref('')

const {data} = await client.GET('/api/get-settings')
systemPrompt.value = data?.systemPrompt || ''
promptTemplate.value = data?.promptTemplate || ''

const saveSettings = async () => {
    const {error} = await client.POST('/api/set-settings', {
        body: {
            systemPrompt: systemPrompt.value,
            promptTemplate: promptTemplate.value,
        },
    })
    if (error) {
        console.error(error)
    } else {
        toast.success('Settings saved')
    }
}
</script>

<template>
    <div class="p-2">
        <div class="flex flex-row">
            <!-- Prompt Settings -->
            <div class="flex flex-col flex-grow">
                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">System Prompt</span>
                    </div>
                    <textarea
                        class="textarea textarea-bordered leading-normal w-full min-h-24"
                        v-model="systemPrompt" />
                </label>
            </div>
        </div>

        <!-- <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">Prompt Syntax Template</span>
            </div>
            <select class="select select-bordered" v-model="promptStore.promptSettings.promptSyntax">
                <option selected value="default">Empty</option>
                <option value="custom">ChatML</option>
            </select>
        </label> -->

        <label class="form-control w-full">
            <div class="label">
                <span class="label-text">Prompt Syntax</span>
            </div>
            <textarea class="textarea textarea-bordered leading-normal w-full min-h-24" v-model="promptTemplate" />
        </label>

        <button class="btn btn-primary mt-9" @click="saveSettings">Save</button>
    </div>
</template>
