<script lang="ts" setup>
import {ref, nextTick, useTemplateRef} from 'vue'
import {marked} from 'marked'
import type {Message} from '@/db'
import {useChatStore} from '@/store'
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowPathIcon,
    TrashIcon,
    CheckIcon,
    PencilSquareIcon,
} from '@heroicons/vue/24/outline'

type Props = {
    index: number
    message: Message
    characterMap: Record<
        string,
        {
            name: string
            image?: string
        }
    >
    avatars: Record<string, string>
    loading: boolean
    showSwipes: boolean
}
const props = defineProps<Props>()
const editMode = ref(false)
const editedText = ref('')
const textarea = useTemplateRef<HTMLTextAreaElement>('message-input')
const emit = defineEmits<{
    (event: 'newSwipe', index: number): void
}>()
const chatStore = useChatStore()

const newSwipe = () => emit('newSwipe', props.index)
const update = () => {
    chatStore.updateMessage(props.index, editedText.value)
    editMode.value = false
}
const deleteMe = async () => chatStore.deleteMessage(props.index)
const swipeLeft = async () => chatStore.swipeLeft(props.index)
const swipeRight = async () => chatStore.swipeRight(props.index)

const enterEdit = async () => {
    editMode.value = !editMode.value
    editedText.value = props.message.content[props.message.activeIndex] || ''
    await nextTick()
    textarea.value?.focus()
}

const quoteWrap = (text: string) => {
    return text.replace(/"([^"]*)"/g, '<q>$1</q>')
}

const formatText = (text: string) => {
    const withQuotes = quoteWrap(text)
    return marked(withQuotes, {breaks: true})
}

const resizeTextarea = async (event: Event) => {
    const textarea = event.target as HTMLTextAreaElement
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
}
</script>

<template>
    <div class="flex flex-col relative mb-2 bg-base-200 rounded-xl">
        <!-- Message Content -->
        <div class="flex flex-row pb-2 pt-3">
            <div class="avatar ml-2">
                <div class="w-16 h-16 rounded-full">
                    <img
                        v-if="avatars[message.characterId]"
                        :src="avatars[message.characterId]"
                        alt="character avatar" />
                    <img v-else src="../assets/img/placeholder-avatar.webp" alt="Oh no" />
                </div>
            </div>

            <div class="flex flex-col flex-grow px-2">
                <div class="font-bold">
                    {{ characterMap[message.characterId]?.name || 'Missing Character' }}
                </div>
                <span v-if="loading" class="loading loading-dots loading-sm mt-2"></span>
                <div
                    v-show="!editMode"
                    v-html="formatText(message.content[message.activeIndex] || '')"
                    class="messageText mx-[-1px] px-[1px] [word-break:break-word]" />
                <textarea
                    v-show="editMode"
                    ref="message-input"
                    v-model="editedText"
                    @input="resizeTextarea"
                    @focus="resizeTextarea"
                    @keydown.ctrl.enter="update"
                    @keydown.esc="editMode = false"
                    data-1p-ignore
                    class="textarea block w-full text-base mx-[-1px] mt-2 px-[1px] py-0 border-none min-h-[0px]" />
            </div>
        </div>

        <!-- Message Controls -->
        <div class="absolute top-1 right-1">
            <!-- Delete -->
            <button v-if="editMode" class="btn btn-square btn-sm btn-error ml-2" @click="deleteMe">
                <TrashIcon class="size-6" />
            </button>
            <button v-if="editMode" @click="update" class="btn btn-square btn-sm btn-accent ml-2 align-top">
                <CheckIcon class="size-6" />
            </button>
            <!-- Edit -->
            <button class="btn btn-square btn-sm btn-neutral ml-2" @click="enterEdit">
                <PencilSquareIcon class="size-6" />
            </button>
        </div>

        <!-- Swipe Controls -->
        <div v-if="showSwipes" class="flex flex-row justify-between px-1 pb-1">
            <!-- Swipe Left -->
            <div class="flex w-16">
                <button @click="swipeLeft" v-show="message.activeIndex > 0" class="btn btn-sm btn-neutral">
                    <ChevronLeftIcon class="size-6 /" />
                </button>
            </div>

            <!-- Swipe Count -->
            <div class="flex" v-show="message.content.length > 1">
                {{ message.activeIndex + 1 }} / {{ message.content.length }}
            </div>

            <!-- Swipe Right / Regen -->
            <div class="flex w-16 justify-end">
                <button
                    @click="swipeRight"
                    v-show:="message.activeIndex < message.content.length - 1"
                    class="btn btn-sm btn-neutral">
                    <ChevronRightIcon class="size-6" />
                </button>
                <button @click="newSwipe" class="btn btn-sm btn-neutral">
                    <ArrowPathIcon class="size-6" />
                </button>
            </div>
        </div>
    </div>
</template>

<style>
@reference "../styles/tailwind.css";
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
