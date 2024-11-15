<script lang="ts" setup>
defineProps<{modelValue: number | undefined}>()
const emit = defineEmits(['update:modelValue'])
const handleUpdate = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.value === '') return emit('update:modelValue', undefined)
    emit('update:modelValue', parseFloat(target.value))
}
</script>

<template>
    <input type="number" :value="modelValue" @input="handleUpdate" />
</template>
