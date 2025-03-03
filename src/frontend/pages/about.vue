<script lang="ts" setup>
import {ref} from 'vue'
import {marked} from 'marked'

const licenseText = ref('')
if (import.meta.env.PROD) {
    const res = await fetch('./acknowledgements.md')
    licenseText.value = await marked(await res.text(), {breaks: true})
} else {
    licenseText.value = '(License text only built in production)'
}
</script>

<template>
    <main>
        <h1 class="text-xl">Acknowledgements</h1>
        <span class="mt-2">This project makes use of the following Open Source projects:</span>

        <div v-html="licenseText" class="licenses mt-5"></div>
    </main>
</template>

<style>
@reference "../styles/tailwind.css";
.licenses h2 {
    @apply text-lg font-bold mt-4;
}
.licenses blockquote {
    @apply bg-base-200 px-2 mt-3 text-base-content;
    border-left: 4px solid var(--color-primary);
}
</style>
