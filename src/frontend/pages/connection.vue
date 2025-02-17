<script lang="ts" setup>
import {useToast} from 'vue-toastification'
import {useConnectionStore} from '@/store'

const toast = useToast()
const connectionStore = useConnectionStore()

const connect = async () => {
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
                <input type="text" v-model="connectionStore.connectionUrl" class="input" />

                <button class="btn btn-primary ml-2" @click="connect">Connect</button>
            </div>
        </fieldset>
    </main>
</template>
