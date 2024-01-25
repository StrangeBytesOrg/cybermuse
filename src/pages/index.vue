<script lang="ts" setup>
import {ref} from 'vue'
import snarkdown from 'snarkdown'
import {llama} from '../completion'

const apiBaseUrl = localStorage.getItem('apiUrl')
const messages = [{userType: 'user', text: 'Hello, I am a user.'}]
const character = {
    name: 'Wat',
}
const avatar = '/placeholder-avatar.webp'
const currentMessage = ref('')
const currentResponse = ref('')
const pendingMessage = ref(false)

const sendMessage = async () => {
    console.log('send message')
    const url = `${apiBaseUrl}/completion`
    const prompt = 'Hello world\n'
    const response = llama(
        prompt,
        {
            n_predict: 128,
            temperature: 0.5,
        },
        {},
        url,
    )

    for await (const chunk of response) {
        console.log(chunk.data.content)
        currentResponse.value += chunk.data.content
    }
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
                    <img
                        v-if="message.containsImage"
                        :src="message.image.imageUrl"
                        @load="scrollMessages()"
                        @click="updateModal(message.image.imageUrl)"
                        class="cursor-pointer" />
                </div>
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
                :disabled="false"
                class="btn btn-primary align-middle md:ml-3 ml-[4px] h-20 md:w-32">
                {{ pendingMessage ? '' : 'Send' }}
                <span class="loading loading-spinner loading-md" :class="{hidden: !pendingMessage}" />
            </button>
        </div>
    </main>
</template>
