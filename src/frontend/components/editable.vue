<script lang="ts" setup>
import {onMounted, watch, ref, nextTick} from 'vue'

const model = defineModel({
    type: String,
    default: '',
})
const element = ref<HTMLElement>()
const props = defineProps({
    editable: {
        type: Boolean,
        default: true,
    },
    focus: Boolean,
})

const handleUpdate = (event: Event) => {
    const target = event.target as HTMLElement
    if (target.innerText === '') return
    model.value = target.innerText
}
onMounted(() => {
    if (!element.value) return
    element.value.innerText = model.value
})
watch(() => model.value, (newVal) => {
    if (!element.value) return
    if (newVal !== element.value.innerText) {
        element.value.innerText = newVal
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
