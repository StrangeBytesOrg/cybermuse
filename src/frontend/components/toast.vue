<script lang="ts" setup>
import {useToastStore} from '@/store'
import {InformationCircleIcon, CheckCircleIcon, ExclamationTriangleIcon} from '@heroicons/vue/24/outline'

const toastStore = useToastStore()
</script>

<template>
    <div class="toast toast-end">
        <div
            v-for="([toastId, toast]) in toastStore.toasts"
            :key="toastId"
            class="alert min-h-14 min-w-70 text-lg"
            :class="toast.type">
            <InformationCircleIcon v-if="toast.type === 'alert-info'" class="size-6" />
            <CheckCircleIcon v-if="toast.type === 'alert-success'" class="size-6" />
            <ExclamationTriangleIcon v-if="toast.type === 'alert-warning'" class="size-6" />
            <ExclamationTriangleIcon v-if="toast.type === 'alert-error'" class="size-6" />
            <span class="whitespace-pre">{{ toast.message }}</span>
        </div>
    </div>
</template>
