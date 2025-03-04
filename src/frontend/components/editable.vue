<script lang="ts" setup>
import {onMounted, ref} from 'vue'

const element = ref<HTMLElement>()
const props = defineProps<{modelValue: string | undefined}>()
const emit = defineEmits(['update:modelValue'])
const handleUpdate = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.value === '') return emit('update:modelValue', undefined)
    emit('update:modelValue', target.innerText)
}
onMounted(() => {
    if (!element.value) return
    element.value.innerText = props.modelValue || ''
})
</script>

<template>
    <div @input="handleUpdate" ref="element" contenteditable></div>
</template>
