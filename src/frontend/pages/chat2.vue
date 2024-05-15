<script lang="ts" setup>
import {reactive, ref, computed, nextTick, watch, onMounted} from 'vue'
import {useRoute} from 'vue-router'
import snarkdown from 'snarkdown'
import {useToast} from 'vue-toastification'
import {client} from '../api-client'
import {responseToIterable} from '../lib/fetch-backend'
import {useConnectionStore} from '../store'

const route = useRoute()
const toast = useToast()
const connectionStore = useConnectionStore()
const chatId = route.query.id
const currentMessage = ref('')
const pendingMessage = ref(false)
const editModeId = ref(0)
const editedText = ref('')
const messagesElement = ref<HTMLElement>()

// Check if generation server is actually running
const checkServer = async () => {
    const {data, error} = await client.GET('/status')
    if (error) {
        toast.error('Error getting server status')
    }
    if (data && data.loaded) {
        connectionStore.connected = true
    }
}
await checkServer()

const {data, error} = await client.GET('/chat/{id}', {
    params: {path: {id: String(chatId)}},
})

if (error) {
    console.error(error)
    toast.error('Failed to load chat')
}

const messages = reactive(data?.chat.messages ?? [])
type Message = (typeof messages)[0]
const characterMap = new Map((data?.chat.characters ?? []).map((character) => [character.id, character]))

const checkSend = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        sendMessage()
    }
}

const sendMessage = async () => {
    const characterId = 1
    const {data, error} = await client.POST('/create-message', {
        body: {
            chatId: Number(chatId),
            characterId: Number(characterId),
            text: currentMessage.value,
            generated: false,
        },
    })

    if (error) {
        toast.error(error.detail || 'Failed sending message')
    }

    if (data && data.messageId) {
        messages.push({
            id: data.messageId,
            chatId: Number(chatId),
            characterId: characterId,
            generated: false,
            activeIndex: 0,
            content: [{text: currentMessage.value, messageId: data.messageId}],
        })
        currentMessage.value = ''
    }
}

const newResponse = async () => {
    const characterId = 2
    const {data, error} = await client.POST('/create-message', {
        body: {
            chatId: Number(chatId),
            characterId,
            text: currentMessage.value,
            generated: true,
        },
    })

    if (error) {
        toast.error(error.detail || 'Failed sending message')
    }

    if (data && data.messageId) {
        messages.push({
            id: data.messageId,
            chatId: Number(chatId),
            characterId,
            generated: true,
            activeIndex: 0,
            content: [{text: currentMessage.value, messageId: data.messageId}],
        })
        currentMessage.value = ''
    }
}

const getMessage = async () => {
    const {response} = await client.POST('/generate-message', {
        body: {
            chatId: Number(chatId),
        },
        parseAs: 'stream',
    })
    const responseIterable = responseToIterable(response)
    let bufferedResponse = ''
    // TODO log error if there is a response after final
    for await (const chunk of responseIterable) {
        const data = JSON.parse(chunk.data)
        if (chunk.event === 'text') {
            console.log(data.text)
            bufferedResponse += data.text
            const lastMessage = messages[messages.length - 1]
            if (lastMessage) {
                lastMessage.content[lastMessage.activeIndex].text = bufferedResponse
            }
        } else if (chunk.event === 'final') {
            console.log('End of response')
            console.log(bufferedResponse)
        } else if (chunk.event === 'error') {
            console.error('Error', data.error)
            toast.error(data.error)
        } else {
            console.error('Unknown event', chunk)
        }
    }
}

const getCharacter = async () => {
    const {data, error} = await client.POST('/get-response-character/{id}', {
        params: {path: {chatId: Number(chatId)}},
    })
    if (error) {
        toast.error(error.detail || 'Failed getting character')
    }
    console.log(data)
}

const editMessage = async (messageId: number) => {
    if (editModeId.value === messageId) {
        cancelEdit()
    } else {
        editModeId.value = messageId
        const message = messages.find((message) => message.id === messageId)
        editedText.value = message?.content[message.activeIndex]?.text || ''
        // Focus the input
        await nextTick()
        const inputElement = document.getElementById(`message-input-${messageId}`) as HTMLTextAreaElement
        inputElement.focus()
    }
}

const cancelEdit = () => {
    // Reset the text to the original
    const message = messages.find((message) => message.id === editModeId.value)
    // if (message) {
    //     message.text = editedText.value
    // }
    if (message && message.activeIndex && message.content[message.activeIndex]) {
        message.content[message.activeIndex].text = editedText.value
        // const content = message.content[message.activeIndex]
    }
    editModeId.value = 0
}

const updateMessage = async (message: Message) => {
    const {error} = await client.POST('/update-message/{id}', {
        params: {path: {id: message.id}},
        body: {
            text: message.content[message.activeIndex]?.text || '',
        },
    })
    if (error) {
        toast.error(error.detail || 'Failed updating message')
    } else {
        editModeId.value = 0
    }
}

const deleteMessage = async (messageId: number) => {
    const {error} = await client.POST('/delete-message/{id}', {
        params: {path: {id: messageId}},
    })

    if (error) {
        toast.error(error.detail || 'Failed deleting message')
        return
    }

    messages.splice(
        messages.findIndex((message) => message.id === messageId),
        1,
    )
}

const newSwipe = async (message: Message) => {
    const {error} = await client.POST('/new-swipe/{messageId}', {
        params: {path: {messageId: message.id}},
    })
    if (error) {
        toast.error(error.detail || 'Failed generating alt')
    } else {
        if (message) {
            message.content.push({text: ''})
            message.activeIndex = message.content.length - 1
        }
    }
}

const swipeLeft = async (message: Message) => {
    const {error} = await client.POST('/swipe-left/{messageId}', {
        params: {path: {messageId: message.id}},
    })
    if (error) {
        toast.error(error.detail || 'Failed swiping left')
    } else {
        message.activeIndex -= 1
    }
}

const swipeRight = async (message: Message) => {
    const {error} = await client.POST('/swipe-right/{messageId}', {
        params: {path: {messageId: message.id}},
    })
    if (error) {
        toast.error(error.detail || 'Failed swiping right')
    } else {
        message.activeIndex += 1
    }
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

const resizeTextarea = async (event: Event) => {
    const textarea = event.target as HTMLTextAreaElement
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
}

watch(messages, async () => {
    await nextTick()
    scrollMessages('smooth')
})

onMounted(() => {
    scrollMessages('instant')
})
</script>

<template>
    <main class="flex flex-col flex-grow min-h-0 pt-2">
        <!-- Messages -->
        <div ref="messagesElement" class="flex-grow overflow-auto px-1 md:px-2">
            <div
                v-for="message in messages"
                :key="message.id"
                class="flex flex-col relative mb-2 bg-base-200 rounded-xl">
                <div class="flex flex-row pb-2 pt-3">
                    <div class="avatar ml-2">
                        <div class="w-16 h-16 rounded-full">
                            <img
                                :src="
                                    characterMap.get(message.characterId)?.image ||
                                    '../assets/img/placeholder-avatar.webp'
                                " />
                        </div>
                    </div>
                    <div class="flex flex-col flex-grow px-2">
                        <div class="font-bold">
                            {{ characterMap.get(message.characterId)?.name || 'Missing Character' }}
                        </div>
                        <div
                            v-show="editModeId !== message.id"
                            v-html="snarkdown(textGoesBrr(message.content[message.activeIndex]?.text || ''))"
                            class="whitespace-pre-wrap mx-[-1px] mt-2 px-[1px] flex-grow" />
                        <textarea
                            v-show="editModeId === message.id"
                            :id="`message-input-${message.id}`"
                            v-model="message.content[message.activeIndex].text"
                            zv-model="editedText"
                            @input="resizeTextarea"
                            @focus="resizeTextarea"
                            @keydown.ctrl.enter="updateMessage(message)"
                            @keydown.esc="cancelEdit"
                            class="textarea block w-full text-base mx-[-1px] mt-2 px-[1px] py-0 border-none" />
                    </div>
                </div>

                <!-- Message control buttons -->
                <div class="absolute top-1 right-1">
                    <!-- Delete -->
                    <button
                        v-if="editModeId === message.id"
                        class="btn btn-square btn-sm btn-error ml-2"
                        @click="deleteMessage(message.id)">
                        <!-- prettier-ignore -->
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    </button>
                    <button
                        v-if="editModeId === message.id"
                        @click="updateMessage(message)"
                        class="btn btn-square btn-sm btn-accent ml-2 align-top">
                        <!-- prettier-ignore -->
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                    </button>
                    <!-- Edit -->
                    <button class="btn btn-square btn-sm btn-neutral ml-2" @click="editMessage(message.id)">
                        <!-- prettier-ignore -->
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                    </button>
                </div>

                <!-- Swipe Controls -->
                <div v-if="message.generated" class="flex flex-row justify-between px-1 pb-1">
                    <!-- Swipe Left -->
                    <div class="flex w-16">
                        <button
                            @click="swipeLeft(message)"
                            v-show="message.activeIndex > 0"
                            :disabled="pendingMessage"
                            class="btn btn-sm btn-neutral">
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
                            @click="swipeRight(message)"
                            :disabled="pendingMessage"
                            v-show:="message.activeIndex < message.content.length - 1"
                            class="btn btn-sm btn-neutral">
                            <!-- prettier-ignore -->
                            <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                        </button>
                        <button @click="newSwipe(message)" :disabled="pendingMessage" class="btn btn-sm btn-neutral">
                            <!-- prettier-ignore -->
                            <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>

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

            <button
                @click="newResponse"
                :disabled="pendingMessage || connectionStore.connected === false"
                class="btn btn-primary align-middle md:ml-3 ml-[4px] h-20 md:w-32">
                New Response
            </button>

            <button
                @click="getMessage"
                :disabled="pendingMessage || connectionStore.connected === false"
                class="btn btn-primary align-middle md:ml-3 ml-[4px] h-20 md:w-32">
                Generate
            </button>
        </div>
    </main>
</template>
