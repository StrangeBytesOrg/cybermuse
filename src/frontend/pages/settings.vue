<script lang="ts" setup>
import {useToastStore, useSettingsStore, useConnectionStore} from '@/store'
import {sync} from '@/sync'

const settings = useSettingsStore()
const connectionStore = useConnectionStore()
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

const setConnectionProvider = (event: Event) => {
    const target = event.target as HTMLSelectElement
    settings.setConnectionProvider(target.value)
}

const connect = async () => {
    if (!connectionStore.connectionUrl.startsWith('http') && !connectionStore.connectionUrl.startsWith('https')) {
        throw new Error('Connection URL must start with http or https')
    }
    await connectionStore.checkConnection()
    connectionStore.save()
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
        <select class="select mt-2" @change="setConnectionProvider" :value="settings.connectionProvider">
            <option value="">Select a provider</option>
            <option value="hub">Cybermuse Hub</option>
            <option value="self-hosted">Self Hosted</option>
        </select>

        <template v-if="settings.connectionProvider === 'self-hosted'">
            <label class="fieldset-label text-sm mt-2">
                Connection URL
                <div class="tooltip tooltip-bottom" data-tip="Requires a llama.cpp server">
                    <div class="badge badge-secondary">?</div>
                </div>
            </label>
            <div class="flex flex-row">
                <input
                    type="text"
                    v-model="connectionStore.connectionUrl"
                    class="input max-w-80"
                />
                <button class="btn btn-primary ml-2" @click="connect">Connect</button>
            </div>
        </template>
    </fieldset>

    <!-- Sync -->
    <fieldset class="mt-3 bg-base-200 rounded-box p-3">
        <legend class="fieldset-legend">Sync</legend>
        <label class="fieldset-label text-sm">Sync Provider</label>
        <div class="flex flex-row">
            <select @change="setSyncProvider" :value="settings.syncProvider" class="select">
                <option value="">Select a provider</option>
                <option value="hub">Cybermuse Hub</option>
                <option value="self-hosted">Self Hosted</option>
            </select>

            <button v-if="settings.syncProvider === 'hub'" @click="sync" class="btn btn-primary ml-2">Sync</button>
        </div>

        <template v-if="settings.syncProvider === 'self-hosted'">
            <label class="fieldset-label text-sm mt-2">Sync Server URL</label>
            <input type="text" class="input mt-2" placeholder="Coming Soon!" />
        </template>
    </fieldset>
</template>
