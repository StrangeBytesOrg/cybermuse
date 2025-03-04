<script lang="ts" setup>
import {onMounted, watch, ref, nextTick} from 'vue'

const element = ref<HTMLElement>()
const props = defineProps({
    modelValue: String,
    editable: {
        type: Boolean,
        default: true,
    },
    focus: Boolean,
})
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
watch(() => props.modelValue, (newVal) => {
    if (!element.value) return
    if (newVal !== element.value.innerText) {
        element.value.innerText = newVal || ''
    }
})
watch(() => props.focus, async (newVal) => {
    if (!element.value) return
    if (newVal === true) {
        await nextTick()
        element.value.focus()
        const range = document.createRange()
        const sel = window.getSelection()
        range.selectNodeContents(element.value)
        range.collapse(false)
        sel?.removeAllRanges()
        sel?.addRange(range)
    }
})
</script>

<template>
    <div @input="handleUpdate" ref="element" :contenteditable="editable"></div>
</template>
