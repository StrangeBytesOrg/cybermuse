<script lang="ts" setup>
import {useConnectionStore} from '../store/connection'

const connectionStore = useConnectionStore()

const connect = () => {
    console.log('connect')
    connectionStore.save()
}
</script>

<template>
    API URL:
    <input type="text" v-model="connectionStore.apiUrl" />
    <button class="btn" @click="connect">Connect</button>
</template>
