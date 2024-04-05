<script lang="ts" setup>
import {useConnectionStore} from '../store'
import {checkConnection} from '../lib/connection-test'

const connectionStore = useConnectionStore()

const saveConnection = () => {
    connectionStore.update()
    checkConnection()
}
</script>

<template>
    <div class="flex flex-col p-2">
        <div class="flex flex-row">
            <label class="form-control w-full max-w-xs">
                <div class="label">
                    <span class="label-text">API URL</span>
                </div>
                <input type="text" class="input input-bordered" v-model="connectionStore.apiUrl" />
            </label>

            <button class="btn btn-primary ml-2 mt-auto" @click="saveConnection">Save</button>
        </div>

        <div class="mt-3">Connection: {{ connectionStore.connected ? 'Connected' : 'Disconnected' }}</div>
    </div>
</template>
