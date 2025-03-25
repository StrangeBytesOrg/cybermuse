<script lang="ts" setup>
import {ref} from 'vue'
import {getImage} from '@/thumbnail'

const props = defineProps<{
    image: string
    alt: string
    width: number
    height: number
}>()

const thumbnail = ref()
const loading = ref(true)
getImage(props.image, props.width, props.height).then((url) => {
    thumbnail.value = url
    loading.value = false
})
</script>

<template>
    <span v-if="loading" class="loading loading-spinner loading-xl"></span>
    <img v-else :src="thumbnail" :alt="props.alt" />
</template>
