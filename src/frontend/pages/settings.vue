<script lang="ts" setup>
import {useToastStore, useSettingsStore} from '@/store'
import {sync, exportData} from '@/sync'

const settings = useSettingsStore()
const toast = useToastStore()
const themes = ['dark', 'forest', 'dracula', 'aqua', 'winter', 'pastel']

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
    <!-- Theme -->
    <fieldset class="bg-base-200 rounded-box p-3">
        <legend class="fieldset-legend">Theme</legend>
        <select class="select" @change="setTheme" :value="settings.theme">
            <option v-for="theme in themes" :value="theme" :key="theme">{{ theme }}</option>
        </select>
    </fieldset>

    <!-- Connection -->
    <fieldset class="mt-3 bg-base-200 rounded-box p-3">
        <legend class="fieldset-legend">Connection</legend>

        <label class="fieldset-label text-sm">Generation Provider</label>
        <select class="select mt-1" @change="setConnectionProvider" :value="settings.connectionProvider">
            <option value="">Select a provider</option>
            <option value="hub">Cybermuse Hub</option>
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
    <fieldset class="mt-3 bg-base-200 rounded-box p-3">
        <legend class="fieldset-legend">Sync</legend>
        <label class="fieldset-label text-sm">Sync Provider</label>
        <div class="flex flex-row">
            <select @change="setSyncProvider" :value="settings.syncProvider" class="select mt-1">
                <option value="">Select a provider</option>
                <option value="hub">Cybermuse Hub</option>
                <option value="self-hosted">Self Hosted</option>
            </select>
        </div>

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

    <!-- Export -->
    <fieldset class="mt-3 bg-base-200 rounded-box p-3">
        <legend class="fieldset-legend">Export Data</legend>
        <button @click="exportData" class="btn btn-primary block">Export Data</button>
    </fieldset>
</template>
