<script lang="ts" setup>
import {useToastStore} from '@/store'
import {InformationCircleIcon, CheckCircleIcon, ExclamationTriangleIcon} from '@heroicons/vue/24/outline'

const toastStore = useToastStore()
</script>

<template>
    <div v-show="toastStore.visible" class="toast toast-end">
        <div class="alert min-h-14 min-w-70 text-lg" :class="`alert-${toastStore.type}`">
            <InformationCircleIcon v-if="toastStore.type === 'info'" class="size-6" />
            <CheckCircleIcon v-if="toastStore.type === 'success'" class="size-6" />
            <ExclamationTriangleIcon v-if="toastStore.type === 'error'" class="size-6" />
            {{ toastStore.message }}
        </div>
    </div>
</template>
