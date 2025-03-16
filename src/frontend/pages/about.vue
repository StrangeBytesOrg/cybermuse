<script lang="ts" setup>
import {ref} from 'vue'

const packages = ref<{name: string; license: string; licenseText: string}[]>([
    {name: 'Example', license: 'MIT', licenseText: 'Acknowledgements only built in production.'},
])
if (import.meta.env.PROD) {
    packages.value = await fetch('./oss-licenses.json').then(res => res.json())
}
</script>

<template>
    <h1 class="text-xl">Acknowledgements</h1>
    <span class="mt-2">This project makes use of the following Open Source projects:</span>

    <div
        v-for="pkg in packages"
        :key="pkg.name"
        class="bg-base-200 border-base-300 border rounded-box px-2 mt-2">
        <h2 class="text-lg">{{ pkg.name }} - {{ pkg.license }}</h2>
        <blockquote class="px-2 mt-2 text-base-content border-l border-l-primary whitespace-pre-wrap">
            {{ pkg.licenseText }}
        </blockquote>
    </div>
</template>
