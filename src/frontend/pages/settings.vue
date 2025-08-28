<script lang="ts" setup>
import {useToastStore, useSettingsStore, useHubStore} from '@/store'
import {sync, exportData, clearData} from '@/sync'
import HubLogin from '@/components/hub-login.vue'

const settings = useSettingsStore()
const hub = useHubStore()
const toast = useToastStore()
const themes = ['dark', 'forest', 'dracula', 'aqua', 'winter', 'pastel']

hub.checkAuth()

const setTheme = async (event: Event) => {
    const target = event.target as HTMLSelectElement
    settings.setTheme(target.value)
}

const setGenerationProvider = (event: Event) => {
    const target = event.target as HTMLSelectElement
    settings.setGenerationProvider(target.value)
    switch (target.value) {
        case 'hub':
            settings.setGenerationServer('https://api.cybermuse.io')
            break
        case 'openrouter':
            settings.setGenerationServer('https://openrouter.ai/api/v1')
            break
        default:
            settings.setGenerationServer('')
            break
    }
}

const setGenerationServer = (event: Event) => {
    const target = event.target as HTMLInputElement
    settings.setGenerationServer(target.value)
}

const setGenerationKey = (event: Event) => {
    const target = event.target as HTMLInputElement
    settings.setGenerationKey(target.value)
}

const setGenerationModel = (event: Event) => {
    const target = event.target as HTMLInputElement
    settings.setGenerationModel(target.value)
}

const testGeneration = async () => {
    const url = `${settings.generationServer.replace(/\/$/, '')}/chat/completions`
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.generationKey}`,
        },
        body: JSON.stringify({
            model: settings.generationModel,
            messages: [{role: 'user', content: 'What is the meaning of life?'}],
            max_tokens: 8,
        }),
    })
    if (!res.ok) {
        toast.error('Connection to server failed')
        return
    }
    console.log(await res.json())
    toast.success('Connection to server successful')
}

const setSyncProvider = (event: Event) => {
    const target = event.target as HTMLSelectElement
    settings.setSyncProvider(target.value)
    switch (target.value) {
        case 'hub':
            settings.setSyncProvider('https://sync.cybermuse.io')
            break
        default:
            settings.setSyncProvider('')
            break
    }
}

const setSyncServer = (event: Event) => {
    const target = event.target as HTMLInputElement
    settings.setSyncServer(target.value)
}

const setSyncSecret = (event: Event) => {
    const target = event.target as HTMLInputElement
    settings.setSyncSecret(target.value)
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
            <select class="select" @change="setTheme" :value="settings.theme">
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

            <!--<label class="fieldset-label text-sm">Generation Provider</label>
            <select class="select mt-1" @change="setGenerationProvider" :value="settings.generationProvider">
                <option value="">Select a provider</option>
                <!~~ <option value="hub" :disabled="!hub.token">Cybermuse Hub {{ !hub.token ? '(Login required)' : '' }}</option> ~~>
                <option value="self-hosted">Self Hosted</option>
                <option value="openrouter">OpenRouter</option>
                <option value="hub">Cybermuse Hub</option>
            </select>

            <template v-if="settings.generationProvider === 'self-hosted'">
                <label class="fieldset-label text-sm mt-2">Server URL</label>
                <input
                    @change="setGenerationServer"
                    :value="settings.generationServer"
                    type="url"
                    class="input validator mt-1"
                    placeholder="Local Generation Server"
                    pattern="^(https?://).*$"
                    title="Must be a valid URL"
                />
                <p class="validator-hint hidden">Must start with "http" or "https"</p>

                <button @click="testGeneration" class="btn btn-primary block mt-3">Test</button>
            </template>

            <label class="fieldset-label text-sm mt-2">API Key</label>
            <input type="text" class="input" v-model="settings.generationKey" />
            <button @click="" class="btn btn-primary mt-3">Save</button>
            <button @click="testGeneration" class="btn btn-secondary mt-3 ml-3">Test</button>-->

            <label class="fieldset-label text-sm">Provider</label>
            <select @change="setGenerationProvider" :value="settings.generationProvider" class="select">
                <option value="">Select a provider</option>
                <option value="custom">Self Hosted/Custom</option>
                <option value="openrouter">OpenRouter</option>
                <option value="hub" :disabled="!hub.token">Cybermuse Hub {{ !hub.token ? '(Login required)' : '' }}</option>
            </select>

            <template v-if="settings.generationProvider === 'custom'">
                <label class="fieldset-label text-sm">Generation Server URL</label>
                <input
                    @change="setGenerationServer"
                    :value="settings.generationServer"
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
                @change="setGenerationModel"
                :value="settings.generationModel"
                type="text"
                class="input"
                placeholder="e.g. gpt-3.5-turbo"
            />

            <label class="fieldset-label text-sm">API Key</label>
            <input
                @change="setGenerationKey"
                :value="settings.generationKey"
                type="text"
                class="input"
            />

            <button @click="testGeneration" class="btn btn-primary">Test</button>
        </fieldset>

        <!-- Sync -->
        <fieldset class="bg-base-200 rounded-box p-3 sm:max-w-sm">
            <legend class="fieldset-legend">Sync</legend>

            <label class="fieldset-label text-sm">Sync Provider</label>
            <select @change="setSyncProvider" :value="settings.syncProvider" class="select mt-1">
                <option value="">Select a provider</option>
                <option value="hub" :disabled="!hub.token">Cybermuse Hub {{ !hub.token ? '(Login required)' : '' }}</option>
                <option value="self-hosted">Self Hosted</option>
            </select>

            <template v-if="settings.syncProvider === 'self-hosted'">
                <label class="fieldset-label text-sm mt-2">Server URL</label>
                <input
                    @change="setSyncServer"
                    :value="settings.syncServer"
                    class="input validator mt-1"
                    required
                    placeholder="Local Generation Server"
                    pattern="^(https?://).*$"
                    title="Must be a valid URL"
                />
                <p class="validator-hint hidden">Must start with "http" or "https"</p>

                <label class="fieldset-label text-sm mt-2">Password</label>
                <input @change="setSyncSecret" :value="settings.syncSecret" type="text" class="input mt-1" />
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
