<script lang="ts" setup>
import {ref, nextTick, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import snarkdown from 'snarkdown'
import {useToast} from 'vue-toastification'
import {responseToIterable} from '../lib/fetch-backend'
import {createPrompt} from '../lib/format-prompt'
import {useConnectionStore, useSettingsStore, usePromptStore} from '../store/'
import {db, type Message} from '../db'
import {useDexieLiveQuery} from '../lib/livequery'
import {client} from '../api-client'

const route = useRoute()
const router = useRouter()
const connectionStore = useConnectionStore()
const settingsStore = useSettingsStore()
const promptStore = usePromptStore()
const toast = useToast()
const responseCharacter = ref('')

connectionStore.connected = true
const chatId = Number(route.query.id)

const currentMessage = ref('')
const pendingMessage = ref(false)
const editModeId = ref(-1)
const messagesElement = ref<HTMLDivElement | null>(null)

const chat = await db.chats.get(chatId)
if (!chat) {
    // TODO handle this better
    setTimeout(() => router.push('/chats'), 3000)
    toast.error('Chat not found')
}
const messages = useDexieLiveQuery(() => db.messages.where({chatId}).toArray(), {initialValue: []})
const characters = await db.characters.toArray()

const checkSend = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        sendMessage()
    }
}

const sendMessage = async () => {
    pendingMessage.value = true
    let prompt = ''

    // Add system prompt
    prompt += createPrompt([
        {
            userType: 'system',
            text: promptStore.promptSettings.systemPrompt,
        },
    ])

    // Add the new user message to the chat
    await db.messages.add({
        chatId,
        user: promptStore.promptSettings.userName,
        userType: 'user',
        userId: 0, // TODO This works, but needs some further consideration
        text: currentMessage.value,
        pending: false,
        altHistory: [''],
        activeMessage: 0,
    })

    // Have the server select a respondent
    const characterNames = characters.map((c) => c.name)
    let respondentPrompt = `<|im_start|>system\nDetermine which character should respond to the user's message.<|im_end|>\n`
    respondentPrompt += `<|im_start|>user\nAvailable Characters: ${JSON.stringify(characterNames)}\nUser Message:"${currentMessage.value}"<|im_end|>\n`
    respondentPrompt += `<|im_start|>assistant\n`
    const {data: responseName} = await client.POST('/api/generate-json', {
        body: {
            prompt: respondentPrompt,
            maxTokens: 32,
            temperature: 0.1,
            schema: {
                enum: characterNames,
            },
        },
    })
    console.log(responseName)
    responseCharacter.value = responseName

    // Add the previous messages to the prompt
    prompt += createPrompt(messages.value) // TODO needs to be trimmed to a certain length
    prompt += `<|im_start|>assistant\n` // TODO this needs to be baked into prompt formatting somehow
    console.log(prompt)

    const randomCharacterId = Math.floor(Math.random() * characters.length)
    const character = characters[randomCharacterId]

    // Add a new empty message for the response
    const newMessage = await db.messages.add({
        chatId,
        user: character.name,
        userType: 'assistant',
        userId: character.id,
        text: '',
        pending: true,
        altHistory: [''],
        activeMessage: 0,
    })

    const {response} = await client.POST('/api/generate-stream', {
        body: {
            prompt,
            maxTokens: settingsStore.generationSettings.maxTokens || 64,
            temperature: settingsStore.generationSettings.temperature,
            topP: Number(settingsStore.generationSettings.topP),
            topK: Number(settingsStore.generationSettings.topK),
        },
        parseAs: 'stream',
    })
    const responseIterable = responseToIterable(response)

    let bufferResponse = ''
    for await (const chunk of responseIterable) {
        const data = JSON.parse(chunk.data)
        if (chunk.event === 'message') {
            bufferResponse += data.text
            await db.messages.update(newMessage, {text: bufferResponse})
        } else if (chunk.event === 'final') {
            if (data.text !== bufferResponse) {
                console.warn(`Final response did not match buffered response`)
                await db.messages.update(newMessage, {text: data.text})
            }
        } else {
            // TODO visually show error
            console.error('Unknown response type')
        }
    }

    // TODO probably need some kind of flag to make sure a final response was received
    await db.messages.update(newMessage, {pending: false})
    pendingMessage.value = false
    currentMessage.value = ''
}

const generateAlt = async (messageId: number) => {
    pendingMessage.value = true
    const message = await db.messages.get(messageId)
    message.altHistory[message.activeMessage] = message.text
    message.altHistory.push('')
    message.activeMessage = message.altHistory.length - 1
    await db.messages.update(messageId, message)
    let prompt = ''

    // Add system prompt
    prompt += createPrompt([
        {
            userType: 'system',
            text: promptStore.promptSettings.systemPrompt,
        },
    ])

    await db.messages.update(messageId, {pending: true, text: ''})

    let messagesBeforeCurrent = await db.messages.where({chatId}).toArray()
    messagesBeforeCurrent = messagesBeforeCurrent.filter((m) => m.id < message.id)

    prompt += createPrompt(messagesBeforeCurrent)
    prompt += `<|im_start|>assistant\n`
    console.log(prompt)

    const {response} = await client.POST('/api/generate-stream', {
        body: {
            prompt,
            maxTokens: settingsStore.generationSettings.maxTokens || 64,
            temperature: settingsStore.generationSettings.temperature,
            topP: Number(settingsStore.generationSettings.topP),
            topK: Number(settingsStore.generationSettings.topK),
        },
        parseAs: 'stream',
    })
    const responseIterable = responseToIterable(response)
    let bufferResponse = ''
    for await (const chunk of responseIterable) {
        const data = JSON.parse(chunk.data)
        if (chunk.event === 'message') {
            bufferResponse += data.text
            await db.messages.update(messageId, {text: bufferResponse})
        } else if (chunk.event === 'final') {
            if (data.text !== bufferResponse) {
                console.warn(`Final response did not match buffered response`)
                await db.messages.update(messageId, {text: data.text})
            }
        } else {
            // TODO visually show error
            console.error('Unknown response type')
        }
    }

    // TODO probably need some kind of flag to make sure a final response was received
    await db.messages.update(messageId, {pending: false})
    pendingMessage.value = false
}

const swipeRight = async (messageId: number) => {
    const message = await db.messages.get(messageId)
    if (!message) {
        throw new Error('Message not found')
    }

    message.altHistory[message.activeMessage] = message.text // Save the current message text to the history
    message.activeMessage += 1 // Move to the next alt
    message.text = message.altHistory[message.activeMessage] || '' // Load the history text into the message
    await db.messages.update(message.id, message)
}

const swipeLeft = async (messageId: number) => {
    const message = await db.messages.get(messageId)
    if (!message) {
        throw new Error('Message not found')
    }
    message.altHistory[message.activeMessage] = message.text
    message.activeMessage -= 1
    message.text = message.altHistory[message.activeMessage] || ''
    await db.messages.update(message.id, message)
}

const editMessage = async (messageId: number) => {
    if (editModeId.value === messageId) {
        cancelEdit()
    } else {
        editModeId.value = messageId
        // Focus the input
        await nextTick()
        const inputElement = document.getElementById(`message-input-${messageId}`) as HTMLTextAreaElement
        inputElement.focus()
    }
}

const saveEdit = async (message: Message) => {
    await db.messages.update(message.id, message)
    editModeId.value = -1
}

const cancelEdit = async () => {
    editModeId.value = -1
}

const deleteMessage = async (messageId: number) => {
    await db.messages.delete(messageId)
}

const resizeTextarea = async (event: Event) => {
    const textarea = event.target as HTMLTextAreaElement
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
}

// Replace all newlines with <br> tags
const textGoesBrr = (text: string) => {
    return text.replace(/\n/g, '<br />')
}

const scrollMessages = (behavior: 'auto' | 'instant' | 'smooth' = 'auto') => {
    messagesElement.value?.scroll({
        top: messagesElement.value?.scrollHeight,
        behavior,
    })
}

watch(messages, async (currentValue, previousValue) => {
    await nextTick()
    // Fast scroll to the bottom on the initial load
    if (previousValue.length === 0) {
        scrollMessages('instant')
    } else {
        scrollMessages('smooth')
    }
})
</script>

<template>
    <main class="flex flex-col flex-grow min-h-0 pt-2">
        <!-- Messages -->
        <div ref="messagesElement" class="flex-grow overflow-auto px-1 md:px-2">
            <div
                v-for="(message, index) in messages"
                v-bind:key="index"
                class="flex flex-col relative mb-2 bg-base-200 rounded-xl">
                <!-- Avatar and Text section -->
                Character: {{ message.userId }} Has Image: {{ Boolean(characters[message.userId]) }}
                <div class="flex flex-row pb-2 pt-3">
                    <div class="avatar ml-2">
                        <div class="w-16 h-16 rounded-full">
                            <img
                                v-if="message.userType === 'user'"
                                src="../assets/img/placeholder-avatar.webp"
                                alt="user" />
                            <!-- <img
                                v-else-if="message.userId && characters[message.userId].image"
                                :src="characters[message.userId].image" /> -->
                            <img v-else src="../assets/img/placeholder-avatar.webp" alt="placeholder avatar" />
                        </div>
                    </div>
                    <div class="flex flex-col flex-grow px-2">
                        <div class="font-bold">{{ message.user }}</div>
                        <div
                            v-html="snarkdown(textGoesBrr(message.text))"
                            v-show="editModeId !== message.id"
                            class="whitespace-pre-wrap mx-[-1px] mt-1 px-[1px] flex-grow" />
                        <!-- @keydown.esc="cancelEdit" -->
                        <textarea
                            :id="`message-input-${message.id}`"
                            v-model="message.text"
                            @input="resizeTextarea"
                            @focus="resizeTextarea"
                            @keydown.ctrl.enter="saveEdit(message)"
                            v-show="editModeId === message.id"
                            class="textarea block w-full text-base mx-[-1px] mt-1 px-[1px] py-0 border-none" />
                        <span v-if="message.pending" class="loading loading-dots loading-sm mb-[-12px]" />
                    </div>
                </div>

                <!-- Message control buttons -->
                <div class="absolute top-1 right-1">
                    <!-- Save -->
                    <button
                        v-if="editModeId == message.id"
                        @click="saveEdit(message)"
                        class="btn btn-sm btn-primary ml-2 align-top">
                        Save
                    </button>
                    <!-- Delete -->
                    <button
                        v-if="editModeId == message.id"
                        class="btn btn-square btn-sm btn-error ml-2"
                        @click="deleteMessage(message.id)">
                        <!-- prettier-ignore -->
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    </button>
                    <!-- Edit -->
                    <button class="btn btn-square btn-sm btn-neutral ml-2" @click="editMessage(message.id)">
                        <!-- prettier-ignore -->
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                    </button>
                </div>

                <!-- Swipe Controls -->
                <div v-if="index === messages.length - 1" class="flex flex-row justify-between px-1 pb-1">
                    <!-- Swipe Left -->
                    <div class="flex w-16">
                        <button
                            v-show="message.altHistory[message.activeMessage - 1]"
                            @click="swipeLeft(message.id)"
                            :disabled="pendingMessage"
                            class="btn btn-sm btn-neutral">
                            <!-- prettier-ignore -->
                            <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                        </button>
                    </div>
                    <div class="flex" v-if="message.altHistory.length > 1">
                        {{ message.activeMessage + 1 }} / {{ message.altHistory.length }}
                    </div>
                    <!-- Swipe Right / Regen -->
                    <div class="flex w-16 justify-end">
                        <button
                            v-if="message.altHistory[message.activeMessage + 1]"
                            @click="swipeRight(message.id)"
                            :disabled="pendingMessage"
                            class="btn btn-sm btn-neutral">
                            <!-- prettier-ignore -->
                            <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                        </button>
                        <button
                            v-else
                            @click="generateAlt(message.id)"
                            :disabled="pendingMessage"
                            class="btn btn-sm btn-neutral">
                            <!-- prettier-ignore -->
                            <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        Res: {{ responseCharacter }}

        <!-- Chat Controls -->
        <div class="flex md:px-2 md:pb-2">
            <textarea
                ref="inputElement"
                id="message-input"
                v-model="currentMessage"
                @keydown="checkSend"
                :disabled="pendingMessage"
                class="textarea textarea-bordered border-2 resize-none flex-1 textarea-xs align-middle text-base h-20 focus:outline-none focus:border-primary" />

            <button
                @click="sendMessage"
                :disabled="pendingMessage || connectionStore.connected === false"
                class="btn btn-primary align-middle md:ml-3 ml-[4px] h-20 md:w-32">
                {{ pendingMessage ? '' : 'Send' }}
                <span class="loading loading-spinner loading-md" :class="{hidden: !pendingMessage}" />
            </button>
        </div>
    </main>
</template>
