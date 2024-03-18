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
    <div class="flex flex-col p-5">
        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">API Type</span>
            </div>
            <select class="select select-bordered" v-model="connectionStore.apiType">
                <option selected value="llamacpp">LlamaCPP Server</option>
                <option value="koboldcpp">KoboldCPP</option>
            </select>
        </label>

        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">API URL</span>
            </div>
            <input type="text" class="input input-bordered" v-model="connectionStore.apiUrl" />
        </label>

        <div class="flex flex-row mt-5">
            <button class="btn btn-primary" @click="saveConnection">Save</button>
        </div>

        <div class="mt-3">Connection: {{ connectionStore.connected ? 'Connected' : 'Disconnected' }}</div>
        <!-- <div>
            Models:
            <ul>
                <li v-for="model in models" :key="model">
                    {{ model }}
                </li>
            </ul>
        </div> -->
    </div>
</template>
