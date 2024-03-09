<script lang="ts" setup>
import {ref} from 'vue'
import snarkdown from 'snarkdown'
import {llama} from '../completion'
import {useConnectionStore, useSettingsStore} from '../store/'
import {db} from '../db'
import {useDexieLiveQuery} from '../livequery'

const route = useRoute()
const connectionStore = useConnectionStore()
const settingsStore = useSettingsStore()

const chatId = Number(route.query.id)
const chat = await db.chats.get(chatId)
const character = await db.characters.get(chat.characterId)
const messages = useDexieLiveQuery(() => db.messages.where('chatId').equals(chatId).toArray(), {initialValue: []})

const avatar = '/placeholder-avatar.webp'
const currentMessage = ref('')
const currentResponse = ref('')
const pendingMessage = ref(false)

const createPrompt = () => {
    let prompt = ''
    // Setup
    prompt += `<|im_start|>system\n`
    prompt += `Play the role of ${character.name} in this chat with User.\n`
    prompt += `${character.name} Description:\n${character.description}\n`
    prompt += `<|im_end|>\n`

    // Previous Messages
    messages.value.forEach((message) => {
        prompt += `<|im_start|>${message.userType}\n`
        prompt += `${message.text}\n`
        prompt += `<|im_end|>\n`
    })

    // Current Message
    prompt += `<|im_start|>user\n`
    prompt += `User: ${currentMessage.value}\n`
    prompt += `<|im_end|>\n`
    prompt += `<|im_start|>assistant\n`
    prompt += `${character.name}:`
    return prompt
}

const checkSend = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        sendMessage()
    }
}

const sendMessage = async () => {
    console.log('send message')
    const url = `${connectionStore.apiUrl}/completion`

    const prompt = createPrompt()
    console.log(prompt)

    pendingMessage.value = true

    await db.messages.add({chatId, user: 'user', text: currentMessage.value})
    const response = llama(
        prompt,
        {
            temperature: settingsStore.generationSettings.temperature,
            top_p: settingsStore.generationSettings.topP,
            top_k: settingsStore.generationSettings.topK,
            n_predict: Number(settingsStore.generationSettings.maxTokens),
        },
        {},
        url,
    )

    for await (const chunk of response) {
        currentResponse.value += chunk.data.content
    }
    pendingMessage.value = false

    await db.messages.add({chatId, user: character.name, text: currentResponse.value})
    currentMessage.value = ''
    currentResponse.value = ''
}

const editMode = ref([])
const editMessage = (messageId: number) => {
    editMode.value[messageId] = true
    console.log(editMode.value)
}

const deleteMessage = async (messageId: number) => {
    await db.messages.delete(messageId)
}
</script>

<template>
    <main class="w-full md:p-5 flex flex-col flex-grow min-h-0">
        <!-- Messages -->
        <div ref="messagesElement" class="md:container md:mx-auto flex-grow overflow-auto pt-3">
            <div
                v-for="(message, index) in messages"
                v-bind:key="index"
                class="flex flex-row justify-between items-start mb-2 p-3 bg-base-200 rounded-xl">
                <div class="avatar">
                    <div class="w-16 rounded-full">
                        <img v-if="message.userType === 'user'" src="/placeholder-avatar.webp" alt="user" />
                        <img v-else :src="avatar" :alt="character.name" />
                    </div>
                </div>
                <div class="flex-grow pl-3">
                    <div class="font-bold">{{ message.user }}</div>
                    <template v-if="editMode[message.id]">
                        <textarea
                            v-model="message.text"
                            @keydown.enter="editMode[message.id] = false"
                            @keydown.esc="editMode[message.id] = false"
                            class="textarea textarea-primary w-full border-2 textarea-bordered text-base h-20 focus:outline-none focus:border-secondary" />
                    </template>
                    <template v-else>
                        <div v-html="snarkdown(message.text)" />
                    </template>
                </div>
                <button class="btn btn-square btn-neutral p-1" @click="deleteMessage(message.id)">
                    <!-- prettier-ignore -->
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <!-- prettier-ignore -->
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                </button>
                <button class="btn btn-square btn-neutral p-1" @click="editMessage(message.id)">
                    <!-- prettier-ignore -->
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <!-- prettier-ignore -->
                        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                </button>
            </div>

            <!-- Loading message -->
            <div
                v-if="pendingMessage"
                class="flex flex-row justify-between items-start mb-2 p-3 bg-base-200 rounded-xl">
                <div class="avatar">
                    <div class="w-16 rounded-full">
                        <img :src="avatar" :alt="character.name" />
                    </div>
                </div>
                <div class="flex-grow pl-3">
                    <div class="font-bold">WAAAAT</div>
                    {{ currentResponse }}
                    <span v-if="currentResponse === ''" class="loading loading-dots loading-sm mb-[-12px]" />
                </div>
            </div>
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
