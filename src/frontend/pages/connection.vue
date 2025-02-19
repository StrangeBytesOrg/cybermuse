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
    <main class="flex flex-col">
        <fieldset class="fieldset">
            <!-- <legend class="fieldset-label text-sm">Connection Type</legend>
            <select class="select">
                <option value="llama.cpp">Llama.cpp Server</option>
            </select> -->

            <label class="fieldset-label text-sm">
                Connection URL
                <div class="tooltip tooltip-bottom" data-tip="Requires a llama.cpp server">
                    <div class="badge badge-secondary">?</div>
                </div>
            </label>
            <div class="flex-row">
                <input type="text" v-model="connectionStore.connectionUrl" class="input max-w-72" />

                <button class="btn btn-primary ml-2" @click="connect">Connect</button>
            </div>
        </fieldset>
    </main>
</template>
