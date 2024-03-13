<script lang="ts" setup>
import {ref, onBeforeMount} from 'vue'
import {useRoute} from 'vue-router'
import snarkdown from 'snarkdown'
import {sseRequest} from '../lib/fetch-backend'
import {createPrompt} from '../lib/format-prompt'
import {useConnectionStore, useSettingsStore} from '../store/'
import {db} from '../db'
import {useDexieLiveQuery} from '../lib/livequery'

const route = useRoute()
const connectionStore = useConnectionStore()
const settingsStore = useSettingsStore()

connectionStore.connected = true
const chatId = Number(route.query.id)

const character = ref({})
const currentMessage = ref('')
const currentResponse = ref('')
const pendingMessage = ref(false)
const editModeActive = ref(false)
const editModeIndex = ref(-1)

const chat = useDexieLiveQuery(() => db.chats.get(chatId), {initialValue: {messages: []}})
onBeforeMount(async () => {
    const {characterId} = await db.chats.get(chatId)
    character.value = await db.characters.get(characterId)
})

const checkSend = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        sendMessage()
    }
}

const sendMessage = async () => {
    console.log('send message')

    let systemPrompt = ''
    systemPrompt += `Play the role of ${character.value.name} in this chat with User.\n`
    systemPrompt += `${character.value.name} Description:\n${character.value.description}\n`

    pendingMessage.value = true
    chat.value.messages.push({user: 'user', userType: 'user', text: currentMessage.value})

    const prompt = createPrompt(systemPrompt, chat.value.messages)
    console.log(prompt)

    const body = JSON.stringify({
        prompt,
        temperature: settingsStore.generationSettings.temperature,
        top_p: settingsStore.generationSettings.topP,
        top_k: settingsStore.generationSettings.topK,
        n_predict: Number(settingsStore.generationSettings.maxTokens),
        stop: ['<|', '<|im_end', '<|im_end|>'],
        stream: true,
    })
    const apiUrl = `${connectionStore.apiUrl}/completion`
    // const apiUrl = `${connectionStore.apiUrl}/api/extra/generate/stream` // Koboldcpp endpoint

    const response = await sseRequest(apiUrl, body)
    for await (const chunk of response) {
        const data = JSON.parse(chunk.data)
        currentResponse.value += data.content
        // currentResponse.value += data.token // Koboldcpp response
    }

    // TODO parse response based on syntax used

    console.log(currentResponse.value)
    pendingMessage.value = false

    chat.value.messages.push({user: character.value.name, userType: 'assistant', text: currentResponse.value})
    await db.chats.update(chatId, chat.value)

    currentMessage.value = ''
    currentResponse.value = ''
}

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
    <main class="w-full md:p-5 flex flex-col flex-grow min-h-0">
        <!-- Messages -->
        <div ref="messagesElement" class="md:container md:mx-auto flex-grow overflow-auto pt-3">
            <template v-if="chat && chat.messages && chat.messages.length">
                <div
                    v-for="(message, index) in chat.messages"
                    v-bind:key="index"
                    class="flex flex-row justify-between items-start mb-2 p-3 bg-base-200 rounded-xl">
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
                </div>

                <!-- Loading message -->
                <div
                    v-if="pendingMessage"
                    class="flex flex-row justify-between items-start mb-2 p-3 bg-base-200 rounded-xl">
                    <div class="avatar">
                        <div class="w-16 rounded-full">
                            <img v-if="character.image" :src="character.image" :alt="character.name" />
                            <img v-else src="../assets/img/placeholder-avatar.webp" alt="placeholder avatar" />
                        </div>
                    </div>
                    <div class="flex-grow pl-3">
                        <div class="font-bold">WAAAAT</div>
                        {{ currentResponse }}
                        <span v-if="currentResponse === ''" class="loading loading-dots loading-sm mb-[-12px]" />
                    </div>
                </div>
            </template>
        </div>

        <div class="flex">
            <textarea
                ref="inputElement"
                id="message-input"
                v-model="currentMessage"
                @keydown="checkSend"
                :disabled="pendingMessage"
                maxlength="500"
                class="textarea textarea-primary border-2 resize-none flex-1 textarea-xs textarea-bordered align-middle text-base h-20 focus:outline-none focus:border-secondary" />

            <!-- Chat Send Button -->
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
