<script lang="ts" setup>
import {onMounted} from 'vue'
import {useConnectionStore} from '../store'
import {checkConnection} from '../lib/connection-test'

const connectionStore = useConnectionStore()
onMounted(async () => {
    await checkConnection()
})
</script>

<template>Connection: {{ connectionStore.connected ? 'Connected' : 'Disconnected' }}</template>
