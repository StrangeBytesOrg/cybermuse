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

const setSyncProvider = (event: Event) => {
    const target = event.target as HTMLSelectElement
    settings.setSyncProvider(target.value)
}

const setSyncServer = (event: Event) => {
    const target = event.target as HTMLInputElement
    settings.setSyncServer(target.value)
}

const setSyncSecret = (event: Event) => {
    const target = event.target as HTMLInputElement
    settings.setSyncSecret(target.value)
}

const setConnectionProvider = (event: Event) => {
    const target = event.target as HTMLSelectElement
    settings.setConnectionProvider(target.value)
}

const setConnectionServer = (event: Event) => {
    const target = event.target as HTMLInputElement
    settings.setConnectionServer(target.value)
}

const doSync = async () => {
    await sync()
    toast.success('Synced')
}

const checkConnection = async () => {
    const healthResponse = await fetch(`${settings.connectionServer}/health`, {
        headers: {token: 'dummy-token'},
    })
    const healthJson = await healthResponse.json()
    if (healthJson.status !== 'ok') {
        throw new Error('Connection failed')
    }
    toast.success('Connected')
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
        <fieldset class="bg-base-200 rounded-box p-3 sm:max-w-sm">
            <legend class="fieldset-legend">Generation</legend>

            <label class="fieldset-label text-sm">Generation Provider</label>
            <select class="select mt-1" @change="setConnectionProvider" :value="settings.connectionProvider">
                <option value="">Select a provider</option>
                <option value="hub" :disabled="!hub.token">Cybermuse Hub {{ !hub.token ? '(Login required)' : '' }}</option>
                <option value="self-hosted">Self Hosted</option>
            </select>

            <template v-if="settings.connectionProvider === 'self-hosted'">
                <label class="fieldset-label text-sm mt-2">Server URL</label>
                <input
                    @change="setConnectionServer"
                    :value="settings.connectionServer"
                    type="url"
                    class="input validator mt-1"
                    placeholder="Local Generation Server"
                    pattern="^(https?://).*$"
                    title="Must be a valid URL"
                />
                <p class="validator-hint hidden">Must start with "http" or "https"</p>

                <button @click="checkConnection" class="btn btn-primary block mt-3">Test</button>
            </template>
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
