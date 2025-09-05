<script lang="ts" setup>
import {useSyncStore} from '@/store'

const syncStore = useSyncStore()
</script>

<template>
    <div v-if="syncStore.isRunning" class="mt-3">
        <div class="text-sm text-base-content/70 mb-2">{{ syncStore.progress.message }}</div>
        <progress
            class="progress w-full"
            :class="
                {
                    'progress-primary': syncStore.progress.phase === 'fetching' || syncStore.progress.phase === 'downloading',
                    'progress-warning': syncStore.progress.phase === 'processing-deletions',
                    'progress-secondary': syncStore.progress.phase === 'uploading',
                    'progress-success': syncStore.progress.phase === 'complete',
                }
            "
            :value="syncStore.progress.current"
            :max="syncStore.progress.total"></progress>
        <div class="text-xs text-base-content/50 mt-1 text-center">
            {{ syncStore.progress.current }}/{{ syncStore.progress.total }}
            ({{ syncStore.progressPercentage }}%)
        </div>
    </div>
</template>
