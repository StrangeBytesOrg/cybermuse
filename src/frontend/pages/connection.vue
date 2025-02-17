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
    <div class="m-2 flex flex-col">
        <fieldset class="fieldset">
            <!-- <legend class="fieldset-label text-sm">Connection Type</legend>
            <select class="select">
                <option value="llama.cpp">Llama.cpp Server</option>
            </select> -->

            <label class="fieldset-label text-sm">Connection URL</label>
            <div class="flex-row">
                <input type="text" v-model="connectionStore.connectionUrl" class="input" />

                <button class="btn btn-primary ml-2" @click="connect">Connect</button>
            </div>
        </fieldset>
    </div>
</template>
