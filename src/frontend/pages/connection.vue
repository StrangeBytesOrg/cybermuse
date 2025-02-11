<script lang="ts" setup>
import {useToast} from 'vue-toastification'
import {useConnectionStore} from '@/store'
import TopBar from '@/components/top-bar.vue'

const toast = useToast()
const connectionStore = useConnectionStore()

const connect = async () => {
    const healthUrl = connectionStore.connectionUrl + '/health'
    const healthRes = await fetch(healthUrl)
    const healthJson = await healthRes.json()

    if (healthJson.status === 'ok') {
        connectionStore.connected = true
        connectionStore.save()
        toast.success('Connected')
    } else {
        throw new Error('Connection failed')
    }
}
</script>

<template>
    <TopBar title="Connection" />

    <div class="flex flex-row m-2">
        <label class="input">
            <input type="text" v-model="connectionStore.connectionUrl" placeholder="Connection URL" />
        </label>

        <button class="btn btn-primary ml-2" @click="connect">Connect</button>
    </div>
</template>
