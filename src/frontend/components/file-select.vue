<script lang="ts" setup>
import {ref} from 'vue'
import {watch} from 'vue'

const props = defineProps(['buttonLabel', 'buttonSize'])
const emit = defineEmits(['changed'])
const fileString = defineModel<string | null>()
const fileInput = ref<HTMLInputElement>()

const onChangeFile = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (file) {
        const reader = new FileReader()
        reader.onload = () => {
            fileString.value = reader.result as string
        }
        reader.readAsDataURL(file)
    }
}

watch(fileString, (newVal) => {
    if (newVal === '' && fileInput.value) {
        fileInput.value.value = ''
    }
    emit('changed', newVal)
})
</script>

<template>
    <div>
        <input type="file" @change="onChangeFile" ref="fileInput" class="hidden" />
        <button class="btn btn-primary" :class="props.buttonSize" @click="fileInput?.click()">
            {{ props.buttonLabel ?? 'Select File' }}
        </button>
    </div>
</template>
