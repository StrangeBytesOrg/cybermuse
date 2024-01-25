<script lang="ts" setup>
import {ref} from 'vue'
const apiUrl = ref(localStorage.getItem('apiUrl') || '')

const setApiUrl = () => {
    localStorage.setItem('apiUrl', apiUrl.value)
}
</script>

<template>
    API URL:
    <input type="text" v-model="apiUrl" />
    <button class="btn" @click="setApiUrl">Set API URL</button>
</template>
