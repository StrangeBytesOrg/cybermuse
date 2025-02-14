<script lang="ts" setup>
import {ref} from 'vue'

const props = defineProps(['buttonLabel', 'buttonSize'])
const emit = defineEmits(['changed'])
const file = defineModel<File>()
const fileInput = ref<HTMLInputElement>()

const onChangeFile = (event: Event) => {
    const target = event.target as HTMLInputElement
    file.value = target.files?.[0]
    emit('changed', file.value)
}
</script>

<template>
    <div>
        <input type="file" @change="onChangeFile" ref="fileInput" class="hidden" />
        <button class="btn btn-primary" :class="props.buttonSize" @click="fileInput?.click()">
            {{ props.buttonLabel ?? 'Select File' }}
        </button>
    </div>
</template>
