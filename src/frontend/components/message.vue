<script lang="ts" setup>
import {ref} from 'vue'
import {marked} from 'marked'
import Editable from '@/components/editable.vue'
import {CheckIcon, PencilSquareIcon} from '@heroicons/vue/24/outline'

const messageText = defineModel({type: String})
const editMode = ref(false)
const editedText = ref('')
const emit = defineEmits<{
    (event: 'update'): void
}>()

const enterEdit = async () => {
    editMode.value = !editMode.value
    editedText.value = messageText.value || ''
}

const quoteWrap = (text: string) => {
    return text.replace(/"([^"]*)"/g, '<q>$1</q>')
}

const formatText = (text: string) => {
    const withQuotes = quoteWrap(text)
    return marked(withQuotes, {breaks: true})
}

const update = async () => {
    messageText.value = editedText.value
    editMode.value = false
    emit('update')
}
</script>

<template>
    <div class="absolute top-1 right-1">
        <button v-if="editMode" @click="update" class="btn btn-square btn-sm btn-accent ml-2 align-top">
            <CheckIcon class="size-6" />
        </button>
        <button class="btn btn-square btn-sm ml-2" @click="enterEdit">
            <PencilSquareIcon class="size-6" />
        </button>
    </div>
    <div
        v-show="!editMode"
        v-html="formatText(messageText || '')"
        class="messageText [word-break:break-word]"
    />
    <Editable
        v-show="editMode"
        v-model="editedText"
        editable="plaintext-only"
        :focus="editMode"
        @keydown.ctrl.enter="update"
        @keydown.esc="editMode = false"
        data-1p-ignore
        class="messageText bg-base-100 whitespace-pre-wrap mt-2"
    />
</template>

<style>
@reference "@/styles/global.css";
.messageText p {
    @apply mt-2;
    color: var(--msg);
}
.messageText q {
    color: var(--quote);
}
.messageText em {
    @apply text-base-content/80;
}
.messageText ol {
    @apply pl-4 list-decimal;
}
.messageText h1 {
    @apply text-xl font-bold;
}
.messageText h2 {
    @apply text-lg font-bold;
}
.messageText pre {
    @apply bg-base-300;
}
.messageText code {
    @apply bg-base-300 whitespace-pre-wrap;
}
.messageText blockquote {
    @apply bg-base-300 px-2;
    border-left: 4px solid var(--quote);
}
</style>
