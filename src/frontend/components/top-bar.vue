<script lang="ts" setup>
import BackButton from './back-button.vue'

const props = defineProps({
    title: String,
    back: Boolean,
})
</script>

<template>
    <div class="flex flex-row p-3 bg-base-300">
        <BackButton v-if="props.back" class="mr-5" />
        <h1 class="text-xl">{{ props.title }}</h1>
        <slot />
    </div>
</template>
