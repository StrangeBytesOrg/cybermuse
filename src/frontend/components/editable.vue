<script lang="ts" setup>
import {onMounted, watch, ref, nextTick} from 'vue'

const model = defineModel({
    type: String,
    default: '',
})
const element = ref<HTMLElement>()
const {editable = 'true', focus = false} = defineProps<{
    editable?: 'true' | 'false' | 'plaintext-only'
    focus?: boolean
}>()

const handleUpdate = (event: Event) => {
    const target = event.target as HTMLElement
    if (target.innerText === '') return
    model.value = target.innerText
}
onMounted(() => {
    if (!element.value) return
    element.value.innerHTML = model.value
})
watch(() => model.value, (newVal) => {
    if (!element.value) return
    if (newVal !== element.value.innerText) {
        element.value.innerHTML = newVal
    }
})
watch(() => focus, async (newVal) => {
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
