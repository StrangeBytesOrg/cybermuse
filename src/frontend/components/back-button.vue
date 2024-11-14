<script lang="ts" setup>
import {useRouter} from 'vue-router'
import {ArrowUturnLeftIcon} from '@heroicons/vue/24/outline'

const router = useRouter()

const goBack = () => router.back()
</script>

<template>
    <button @click="goBack" class="btn btn-sm btn-neutral">
        <ArrowUturnLeftIcon class="size-6" />
    </button>
</template>
