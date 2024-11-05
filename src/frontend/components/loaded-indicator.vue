<script lang="ts" setup>
import {useModelStore} from '@/store'

const modelStore = useModelStore()
</script>

<template>
    <div>Model Loaded: {{ modelStore.loaded }}</div>
</template>
