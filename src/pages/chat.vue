<script lang="ts" setup>
import {ref} from 'vue'
import snarkdown from 'snarkdown'
import {llama} from '../completion'
import {useConnectionStore, useCharacterStore, useMessageStore, useSettingsStore} from '../store/'

const route = useRoute()
const connectionStore = useConnectionStore()
const settingsStore = useSettingsStore()
const characterStore = useCharacterStore()
const messageStore = useMessageStore()

const characterId = route.query.id
const character = characterStore.characters[characterId]
const messages = messageStore.messages

const avatar = '/placeholder-avatar.webp'
const currentMessage = ref('')
const currentResponse = ref('')
const pendingMessage = ref(false)

console.log({gen: settingsStore.generationSettings})

const createPrompt = () => {
    let prompt = ''
    // Setup
    prompt += `<|im_start|>system\n`
    prompt += `Play the role of ${character.name} in this chat with User.\n`
    prompt += `${character.name} Description:\n${character.description}\n`
    prompt += `<|im_end|>\n`

    // Previous Messages
    messages.forEach((message) => {
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

const sendMessage = async () => {
    console.log('send message')
    const url = `${connectionStore.apiUrl}/completion`

    const prompt = createPrompt()
    console.log(prompt)

    pendingMessage.value = true
    messages.push({userType: 'user', user: 'user', text: currentMessage.value})
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

    messages.push({userType: 'bot', user: character.name, text: currentResponse.value})
    currentMessage.value = ''
    currentResponse.value = ''
    messageStore.update()
}

const deleteMessage = (messageIndex: number) => {
    messages.splice(messageIndex, 1)
    messageStore.update()
}
</script>

<template>
    <main class="w-full md:p-5 flex flex-col flex-grow min-h-0">
        <!-- Messages -->
        <div ref="messagesElement" class="md:container md:mx-auto flex-grow overflow-auto pt-3">
            <div v-for="(message, index) in messages" v-bind:key="index" class="flex items-start mb-5">
                <div class="avatar">
                    <div class="w-16 rounded-full">
                        <img v-if="message.userType === 'user'" src="/placeholder-avatar.webp" alt="user" />
                        <img v-else :src="avatar" :alt="character.name" />
                    </div>
                </div>
                <div class="inline-block pl-3">
                    <div class="font-bold">{{ message.user }}</div>
                    <div v-html="snarkdown(message.text)" />
                </div>
                <button class="btn btn-error" @click="deleteMessage(index)">Delete</button>
            </div>

            <!-- Loading message -->
            <div v-if="pendingMessage" class="flex items-start mb-5">
                <div class="avatar">
                    <div class="w-16 rounded-full">
                        <img :src="avatar" :alt="character.name" />
                    </div>
                </div>
                <div class="inline-block pl-3">
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
