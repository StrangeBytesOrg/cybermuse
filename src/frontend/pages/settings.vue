<script lang="ts" setup>
import {watch, ref} from 'vue'
import {generateText} from 'ai'
import {createOpenAICompatible} from '@ai-sdk/openai-compatible'
import {useToastStore, useSettingsStore, useHubStore} from '@/store'
import {sync, exportData, clearData} from '@/sync'
import HubLogin from '@/components/hub-login.vue'

const settings = useSettingsStore()
const hub = useHubStore()
const toast = useToastStore()
const themes = ['dark', 'forest', 'dracula', 'aqua', 'winter', 'pastel']
const validJson = ref(true)

hub.checkAuth()

// Watch for provider changes to auto-set server URLs
watch(() => settings.generationProvider, (newProvider) => {
    switch (newProvider) {
        case 'hub':
            settings.generationServer = 'https://api.cybermuse.io'
            break
        case 'openrouter':
            settings.generationServer = 'https://openrouter.ai/api/v1'
            break
        default:
            settings.generationServer = ''
            break
    }
})

watch(() => settings.syncProvider, (newProvider) => {
    switch (newProvider) {
        case 'hub':
            settings.syncServer = 'https://sync.cybermuse.io'
            break
        default:
            settings.syncServer = ''
            break
    }
})

watch(() => settings.providerOptions, (newOptions) => {
    try {
        JSON.parse(newOptions || '{}')
        validJson.value = true
    } catch {
        validJson.value = false
    }
})

const testGeneration = async () => {
    const endpoint = createOpenAICompatible({
        name: 'custom',
        baseURL: settings.generationServer,
        apiKey: settings.generationKey ?? '',
    })
    try {
        await generateText({
            model: endpoint(settings.generationModel ?? ''),
            messages: [{role: 'user', content: 'What is the meaning of life?'}],
            maxOutputTokens: 8,
        })
        toast.success('Connection to server successful')
    } catch (err) {
        console.error(err)
        toast.error('Error connecting to server')
    }
}

const doSync = async () => {
    await sync()
    toast.success('Synced')
}
</script>

<template>
    <div class="flex flex-col gap-1">
        <!-- Theme -->
        <fieldset class="bg-base-200 rounded-box p-3 sm:max-w-sm">
            <legend class="fieldset-legend">Theme</legend>
            <select class="select" v-model="settings.theme">
                <option v-for="theme in themes" :value="theme" :key="theme">{{ theme }}</option>
            </select>
        </fieldset>

        <!-- Hub -->
        <fieldset class="bg-base-200 rounded-box p-3 sm:max-w-sm">
            <legend class="fieldset-legend">Cybermuse Hub</legend>

            <template v-if="hub.token">
                Logged into Hub
                <button @click="hub.logout" class="btn btn-error block mt-3">Logout</button>
            </template>
            <HubLogin v-else />
        </fieldset>

        <!-- Generation -->
        <fieldset class="bg-base-200 rounded-box p-3 flex flex-col gap-y-3 sm:max-w-sm">
            <legend class="fieldset-legend">Generation</legend>

            <label class="fieldset-label text-sm">Provider</label>
            <select v-model="settings.generationProvider" class="select">
                <option value="">Select a provider</option>
                <option value="custom">Self Hosted/Custom</option>
                <option value="openrouter">OpenRouter</option>
                <option value="hub" :disabled="!hub.token">Cybermuse Hub {{ !hub.token ? '(Login required)' : '' }}</option>
            </select>

            <template v-if="settings.generationProvider === 'custom'">
                <label class="fieldset-label text-sm">Generation Server URL</label>
                <input
                    v-model="settings.generationServer"
                    type="url"
                    class="input validator"
                    placeholder="Local Generation Server"
                    pattern="^(https?://).*$"
                    title="Must be a valid URL"
                />
            </template>
            <template v-else>
                <label class="label">Server: {{ settings.generationServer }}</label>
            </template>

            <label class="fieldset-label text-sm">Generation Model</label>
            <input
                v-model="settings.generationModel"
                type="text"
                class="input"
                placeholder="e.g. gpt-3.5-turbo"
            />

            <label class="fieldset-label text-sm">API Key</label>
            <input
                v-model="settings.generationKey"
                type="text"
                class="input"
            />

            <label class="label">Provider Options</label>
            <textarea class="textarea" v-model="settings.providerOptions"></textarea>
            <p v-if="!validJson" class="text-error text-sm">Provider options must be valid JSON</p>

            <button @click="testGeneration" class="btn btn-primary w-full">Test</button>
        </fieldset>

        <!-- Sync -->
        <fieldset class="bg-base-200 rounded-box p-3 sm:max-w-sm">
            <legend class="fieldset-legend">Sync</legend>

            <label class="fieldset-label text-sm">Sync Provider</label>
            <select v-model="settings.syncProvider" class="select mt-1">
                <option value="">Select a provider</option>
                <option value="hub" :disabled="!hub.token">Cybermuse Hub {{ !hub.token ? '(Login required)' : '' }}</option>
                <option value="self-hosted">Self Hosted</option>
            </select>

            <template v-if="settings.syncProvider === 'self-hosted'">
                <label class="fieldset-label text-sm mt-2">Server URL</label>
                <input
                    v-model="settings.syncServer"
                    class="input validator mt-1"
                    required
                    placeholder="Local Generation Server"
                    pattern="^(https?://).*$"
                    title="Must be a valid URL"
                />
                <p class="validator-hint hidden">Must start with "http" or "https"</p>

                <label class="fieldset-label text-sm mt-2">Password</label>
                <input v-model="settings.syncSecret" type="text" class="input mt-1" />
            </template>

            <button v-if="settings.syncProvider" @click="doSync" class="btn btn-primary block mt-3">Sync</button>
        </fieldset>

        <!-- Data -->
        <fieldset class="flex flex-row gap-3 bg-base-200 rounded-box p-3 sm:max-w-sm">
            <legend class="fieldset-legend">Manage Data</legend>
            <button @click="exportData" class="btn btn-primary">Export Data</button>
            <button @click="clearData" class="btn btn-error">Clear Data</button>
        </fieldset>
    </div>
</template>
