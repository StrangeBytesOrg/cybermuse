<script lang="ts" setup>
import {ref, nextTick, useTemplateRef} from 'vue'
import {marked} from 'marked'
import type {Message} from '@/db'
import {useChatStore} from '@/store'

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

const formatText = (text: string) => {
    const regex = /"([^"]*)"/g
    return marked(text.replace(regex, '<q>$1</q>'))
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
                        v-if="characterMap[message.characterId]?.image"
                        :src="`/avatars/${characterMap[message.characterId]?.image}`"
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
                    class="messageText mx-[-1px] mt-2 px-[1px] [word-break:break-word] whitespace-pre-wrap" />
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
                <!-- prettier-ignore -->
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
            </button>
            <button v-if="editMode" @click="update" class="btn btn-square btn-sm btn-accent ml-2 align-top">
                <!-- prettier-ignore -->
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
            </button>
            <!-- Edit -->
            <button class="btn btn-square btn-sm btn-neutral ml-2" @click="enterEdit">
                <!-- prettier-ignore -->
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
            </button>
        </div>

        <!-- Swipe Controls -->
        <div v-if="showSwipes" class="flex flex-row justify-between px-1 pb-1">
            <!-- Swipe Left -->
            <div class="flex w-16">
                <button @click="swipeLeft" v-show="message.activeIndex > 0" class="btn btn-sm btn-neutral">
                    <!-- prettier-ignore -->
                    <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
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
                    <!-- prettier-ignore -->
                    <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                </button>
                <button @click="newSwipe" class="btn btn-sm btn-neutral">
                    <!-- prettier-ignore -->
                    <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                </button>
            </div>
        </div>
    </div>
</template>
