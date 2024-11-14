<script lang="ts" setup>
import {defineEmits} from 'vue'

defineProps<{modelValue: number | undefined}>()
const emit = defineEmits(['update:modelValue'])
const handleUpdate = (event: Event) => {
    const target = event.target as HTMLInputElement
    emit('update:modelValue', parseFloat(target.value) || undefined)
}
</script>

<template>
    <input type="number" :value="modelValue" @input="handleUpdate" />
</template>
