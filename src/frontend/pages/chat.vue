<script lang="ts" setup>
import {ref} from 'vue'
import {useRoute} from 'vue-router'
import snarkdown from 'snarkdown'
import {request, type GenerationParams} from '../lib/fetch-backend'
import {createPrompt} from '../lib/format-prompt'
import {useConnectionStore, useSettingsStore, usePromptStore} from '../store/'
import {db} from '../db'
import {useDexieLiveQuery} from '../lib/livequery'

const route = useRoute()
const connectionStore = useConnectionStore()
const settingsStore = useSettingsStore()
const promptStore = usePromptStore()

connectionStore.connected = true
const chatId = Number(route.query.id)

const character = ref({})
const currentMessage = ref('')
const pendingMessage = ref(false)
const editModeActive = ref(false)
const editModeIndex = ref(-1)

const chat = await useDexieLiveQuery(() => db.chats.get(chatId), {initialValue: {messages: []}})
const {characterId} = await db.chats.get(chatId)
character.value = await db.characters.get(characterId)

const checkSend = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        sendMessage()
    }
}

const sendMessage = async () => {
    console.log('send message')

    let prompt = ''

    // Add system prompt
    prompt += createPrompt([
        {
            userType: 'system',
            text: promptStore.promptSettings.systemPrompt,
        },
    ])

    pendingMessage.value = true

    // Add the new user message to the chat
    // Also add a new message to the chat for the response
    chat.value.messages.push({user: 'user', userType: 'user', text: currentMessage.value})
    await db.chats.update(chatId, chat.value)

    prompt += createPrompt(chat.value.messages)
    prompt += `<|im_start|>assistant\n` // TODO this needs to be baked into prompt formatting somehow
    console.log(prompt)

    chat.value?.messages.push({user: character.value.name, userType: 'assistant', text: ''}) // TODO add a pending flag
    await db.chats.update(chatId, chat.value)

    const generationSettings: GenerationParams = {
        prompt,
        n_predict: 32,
        temperature: settingsStore.generationSettings.temperature,
        top_p: Number(settingsStore.generationSettings.topP),
        top_k: Number(settingsStore.generationSettings.topK),
        stop: ['<|im_end|>'],
        seed: 80085,
        stream: true,
    }

    let bufferResponse = ''
    const response = await request(connectionStore.apiUrl, 'koboldcpp', generationSettings)
    for await (const chunk of response) {
        const data = JSON.parse(chunk.data)
        bufferResponse += data.token // Koboldcpp response

        // Update the last message in the chat with the current response
        chat.value.messages[chat.value.messages.length - 1].text = bufferResponse
        await db.chats.update(chatId, chat.value)
    }

    // TODO parse response based on syntax used
    console.log('Response:', bufferResponse)

    pendingMessage.value = false
    currentMessage.value = ''
}

const swipeRight = () => {}

const editMessage = (messageIndex: number) => {
    editModeActive.value = !editModeActive.value // Toggle value
    editModeIndex.value = messageIndex
}

const saveEdit = async () => {
    await db.chats.update(chatId, chat.value)
    editModeActive.value = false
    editModeIndex.value = -1
}

const deleteMessage = async (messageIndex: number) => {
    chat.value.messages.splice(messageIndex, 1)
    await db.chats.update(chatId, chat.value)
}
</script>

<template>
    <main class="flex flex-col flex-grow min-h-0">
        <!-- Messages -->
        <div ref="messagesElement" class="flex-grow overflow-auto px-1 md:px-3">
            <template v-if="chat && chat.messages && chat.messages.length">
                <div
                    v-for="(message, index) in chat.messages"
                    v-bind:key="index"
                    class="flex flex-row relative min-h-36 justify-between items-start mb-2 p-3 bg-base-200 rounded-xl">
                    <div class="avatar">
                        <div class="w-16 rounded-full">
                            <img
                                v-if="message.userType === 'user'"
                                src="../assets/img/placeholder-avatar.webp"
                                alt="user" />
                            <img v-else-if="character.image" :src="character.image" :alt="character.name" />
                            <img v-else src="../assets/img/placeholder-avatar.webp" alt="placeholder avatar" />
                        </div>
                    </div>
                    <div class="flex-grow pl-3">
                        <div class="font-bold">{{ message.user }}</div>
                        <template v-if="editModeActive && editModeIndex == index">
                            <textarea
                                v-model="message.text"
                                @keydown.ctrl.enter="saveEdit"
                                @keydown.esc="editModeActive = false"
                                class="textarea textarea-primary w-full border-2 textarea-bordered text-base mt-2 h-20 focus:outline-none focus:border-secondary" />
                        </template>
                        <template v-else>
                            <div v-html="snarkdown(message.text)" />
                            <!-- TODO change to use an explicit loading flag on the message object -->
                            <span v-if="message.text === ''" class="loading loading-dots loading-sm mb-[-12px]" />
                        </template>
                    </div>

                    <!-- Message control buttons -->
                    <button
                        v-if="editModeActive && editModeIndex == index"
                        @click="saveEdit"
                        class="flex btn btn-primary max-w-32 align-end ml-2">
                        Save
                    </button>
                    <button class="btn btn-square btn-neutral p-1 ml-2" @click="editMessage(index)">
                        <!-- prettier-ignore -->
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                            <!-- prettier-ignore -->
                            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                    </button>
                    <button class="btn btn-square btn-neutral p-1 ml-2" @click="deleteMessage(index)">
                        <!-- prettier-ignore -->
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                            <!-- prettier-ignore -->
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>

                    <!-- Swipe Buttons -->
                    <template v-if="index === chat.messages.length - 1">
                        <div class="btn btn-sm btn-neutral absolute bottom-3 left-3">
                            <!-- prettier-ignore -->
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                            </svg>
                        </div>
                        <div class="btn btn-sm btn-neutral absolute bottom-3 right-3">
                            <!-- prettier-ignore -->
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                        </div>
                    </template>
                </div>
            </template>
        </div>

        <!-- Chat Controls -->
        <div class="flex md:px-3 md:pb-2">
            <textarea
                ref="inputElement"
                id="message-input"
                v-model="currentMessage"
                @keydown="checkSend"
                :disabled="pendingMessage"
                class="textarea textarea-primary border-2 resize-none flex-1 textarea-xs textarea-bordered align-middle text-base h-20 focus:outline-none focus:border-secondary" />

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
