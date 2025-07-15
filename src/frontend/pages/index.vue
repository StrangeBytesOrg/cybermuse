<script lang="ts" setup>
import {useSettingsStore, useHubStore} from '@/store'

const settings = useSettingsStore()
const hub = useHubStore()
</script>

<template>
    <div class="flex flex-col flex-1 items-center justify-center">
        <div v-if="!settings.generationProvider" class="card flex justify-center mx-5">
            <h1 class="text-2xl text-center">Welcome</h1>
            <div class="text-lg mt-3">Select a generation provider in the settings to begin</div>
            <router-link :to="{name: 'settings'}" class="btn btn-sm btn-primary mt-5 mx-auto max-w-32">Go to Settings</router-link>
        </div>

        <div v-else-if="settings.generationProvider === 'hub' && !hub.token" class="card">
            <div class="text-xl">Login Expired</div>
            <router-link :to="{name: 'settings'}" class="btn btn-sm btn-primary mt-4">Go to Settings</router-link>
        </div>

        <div v-else class="card">
            <h1 class="text-xl font-bold">Welcome back</h1>
        </div>
    </div>
</template>
