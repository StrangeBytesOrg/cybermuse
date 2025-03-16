<script lang="ts" setup>
import {useConnectionStore, useToastStore} from '@/store'

const toast = useToastStore()
const connectionStore = useConnectionStore()

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
    <label class="label">Generation Provider</label>
    <div class="flex flex-row">
        <select v-model="connectionStore.connectionProvider" class="select">
            <option value="">Select a provider</option>
            <option value="hub" disabled>Cybermuse Hub</option>
            <option value="self-hosted">Self Hosted</option>
        </select>
    </div>

    <template v-if="connectionStore.connectionProvider === 'self-hosted'">
        <label class="label">
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
</template>
