<script lang="ts" setup>
import {reactive, ref, nextTick, onMounted} from 'vue'
import {useRoute} from 'vue-router'
import {marked} from 'marked'
import {useToast} from 'vue-toastification'
import {characterCollection, chatCollection, loreCollection, templateCollection, userCollection} from '@/db'
import {streamingClient} from '../api-client'
import {useModelStore} from '../store'
import {Template} from '@huggingface/jinja'

const route = useRoute()
const toast = useToast()
const modelStore = useModelStore()
const chatId = route.query.id
const currentMessage = ref('')
const pendingMessage = ref(false)
const editModeId = ref(-1)
const editedText = ref('')
const messagesElement = ref<HTMLElement>()
let lastScrollTime = Date.now()
const showCtxMenu = ref(false)
let abortController = new AbortController()

// Check if a model is loaded on page load
await modelStore.getLoaded()
console.log('loaded: ', modelStore.loaded)

if (!chatId || Array.isArray(chatId)) {
    // router.push('/chats')
    throw new Error('Invalid chat ID')
}

const chat = reactive(await chatCollection.findById(chatId))
const characters = await characterCollection.find()
const lore = await loreCollection.find()
const messages = reactive(chat.messages)
const userCharacter = chat.userCharacter
const characterMap = new Map(characters.map((c) => [c._id, c]))
type Message = (typeof messages)[0]

const fullSend = async (event: KeyboardEvent | MouseEvent) => {
    event.preventDefault()

    if (pendingMessage.value) {
        toast.error('Message already in progress')
        return
    }
    if (!modelStore.loaded) {
        toast.error('Generation server not running or not connected')
        return
    }

    // Only create a new user message if there is text
    if (currentMessage.value !== '') {
        await createMessage(userCharacter, currentMessage.value, 'user')
    }

    let characterId
    if (chat.characters.length > 1) {
        // characterId = await client.generate.pickCharacter.mutate(chatId)
        throw new Error('Multi-character chat not implemented')
    } else if (chat.characters[0]) {
        characterId = chat.characters[0]
    } else {
        toast.error('Missing characters')
        return
    }

    // Create a new empty message for the response
    await createMessage(characterId, '', 'model')

    await generateMessage()
}

const impersonate = async () => {
    if (pendingMessage.value) {
        toast.error('Message already in progress')
        return
    }
    if (!modelStore.loaded) {
        toast.error('Generation server not running or not connected')
        return
    }

    await createMessage(userCharacter, '', 'model')
    await generateMessage()
}

const createMessage = async (characterId: string, text: string = '', type: 'user' | 'model' | 'system') => {
    chat.messages.push({
        characterId,
        type,
        content: [text],
        activeIndex: 0,
    })
    await chatCollection.update(chat)

    currentMessage.value = ''
    await nextTick()
    scrollMessages('smooth')
}

const generateMessage = async () => {
    pendingMessage.value = true
    const lastMessage = messages[messages.length - 1]

    if (!lastMessage) {
        // Realistically this probably can't happen but it keeps TS happy
        throw new Error('No messages to generate into')
    }

    try {
        const {promptTemplate} = await userCollection.findById('default-user')
        const template = await templateCollection.findById(promptTemplate)
        const jTemplate = new Template(template.template)
        const systemPrompt = jTemplate.render({
            characters,
            lore,
        })
        console.log(`systemPrompt: ${systemPrompt}`)
        const messages = chat.messages.map((message) => {
            return {type: message.type, content: message.content[message.activeIndex] || ''}
        })
        const generationSettings = {
            maxTokens: 32,
            temperature: 1,
            seed: Math.random() * 100000,
        }
        const iterable = await streamingClient.generate.generate.mutate({systemPrompt, messages, generationSettings})
        for await (const text of iterable) {
            lastMessage.content[lastMessage.activeIndex] = text
            scrollMessages('smooth')
            console.log('text: ', text)
        }
        await chatCollection.update(chat)
    } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.message === 'Invalid response or stream interrupted') return
        throw error
    } finally {
        console.log('done pending')
        pendingMessage.value = false
    }
}

const stopGeneration = () => {
    abortController.abort()
    pendingMessage.value = false
    abortController = new AbortController()
}

const editMessage = async (messageIndex: number) => {
    if (editModeId.value === messageIndex) {
        cancelEdit()
    } else {
        editModeId.value = messageIndex
        const message = messages[messageIndex]
        editedText.value = message?.content[message.activeIndex] || ''
        // Focus the input
        await nextTick()
        const inputElement = document.getElementById(`message-input-${messageIndex}`) as HTMLTextAreaElement
        inputElement.focus()
    }
}

const cancelEdit = () => {
    // Reset the text to the original value
    const message = messages[editModeId.value]
    if (message) {
        message.content[message.activeIndex] = editedText.value
    }
    editModeId.value = -1
}

const updateMessage = async () => {
    await chatCollection.update(chat)
    editModeId.value = -1
}

const deleteMessage = async (messageIndex: number) => {
    chat.messages.splice(messageIndex, 1)
    await chatCollection.update(chat)
    editModeId.value = -1
}

const newSwipe = async (message: Message) => {
    message.content.push('')
    message.activeIndex = message.content.length - 1

    await chatCollection.update(chat)

    await generateMessage()
}

const swipeLeft = async (message: Message) => {
    if (message.activeIndex > 0) {
        message.activeIndex -= 1
        await chatCollection.update(chat)
    }
}

const swipeRight = async (message: Message) => {
    message.activeIndex += 1
    await chatCollection.update(chat)
}

const quoteWrap = (text: string) => {
    const regex = /"([^"]*)"/g
    return text.replace(regex, '<q>$1</q>')
}

const formatText = (text: string) => {
    return marked(quoteWrap(text))
}

const resizeTextarea = async (event: Event) => {
    const textarea = event.target as HTMLTextAreaElement
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
}

const scrollMessages = (behavior: 'auto' | 'instant' | 'smooth' = 'auto') => {
    if (Date.now() - lastScrollTime < 100 && behavior === 'smooth') return
    lastScrollTime = Date.now()

    messagesElement.value?.scroll({
        top: messagesElement.value?.scrollHeight,
        behavior,
    })
}

onMounted(() => {
    scrollMessages('instant')
})

const toggleCtxMenu = () => {
    showCtxMenu.value = !showCtxMenu.value
}
</script>

<template>
    <main class="flex flex-col pt-2 min-h-[100vh] max-h-[100vh]">
        <!-- Messages -->
        <div ref="messagesElement" class="flex-grow overflow-y-auto px-1 md:px-2 w-full max-w-[70em] ml-auto mr-auto">
            <div
                v-for="(message, index) in messages"
                :key="index"
                class="flex flex-col relative mb-2 bg-base-200 rounded-xl">
                <div class="flex flex-row pb-2 pt-3">
                    <div class="avatar ml-2">
                        <div class="w-16 h-16 rounded-full">
                            <img
                                v-if="characterMap.get(message.characterId)?.image"
                                :src="`/avatars/${characterMap.get(message.characterId)?.image}`" />
                            <img v-else src="../assets/img/placeholder-avatar.webp" alt="Oh no" />
                        </div>
                    </div>
                    <div class="flex flex-col flex-grow px-2">
                        <div class="font-bold">
                            {{ characterMap.get(message.characterId)?.name || 'Missing Character' }}
                        </div>
                        <span
                            v-if="
                                pendingMessage &&
                                index === messages.length - 1 &&
                                message.content[message.activeIndex] === ''
                            "
                            class="loading loading-dots loading-sm mt-2"></span>
                        <div
                            v-show="editModeId !== index"
                            v-html="formatText(message.content[message.activeIndex] || '')"
                            class="messageText mx-[-1px] mt-2 px-[1px] [word-break:break-word] whitespace-pre-wrap" />
                        <textarea
                            v-show="editModeId === index"
                            :id="`message-input-${index}`"
                            v-model="message.content[message.activeIndex]"
                            @input="resizeTextarea"
                            @focus="resizeTextarea"
                            @keydown.ctrl.enter="updateMessage()"
                            @keydown.esc="cancelEdit"
                            data-1p-ignore
                            class="textarea block w-full text-base mx-[-1px] mt-2 px-[1px] py-0 border-none min-h-[0px]" />
                    </div>
                </div>

                <!-- Message control buttons -->
                <div class="absolute top-1 right-1">
                    <!-- Delete -->
                    <button
                        v-if="editModeId === index"
                        class="btn btn-square btn-sm btn-error ml-2"
                        @click="deleteMessage(index)">
                        <!-- prettier-ignore -->
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    </button>
                    <button
                        v-if="editModeId === index"
                        @click="updateMessage()"
                        class="btn btn-square btn-sm btn-accent ml-2 align-top">
                        <!-- prettier-ignore -->
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                    </button>
                    <!-- Edit -->
                    <button class="btn btn-square btn-sm btn-neutral ml-2" @click="editMessage(index)">
                        <!-- prettier-ignore -->
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                    </button>
                </div>

                <!-- Swipe Controls -->
                <div v-if="message.type === 'model' || 1" class="flex flex-row justify-between px-1 pb-1">
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
                        <button
                            @click="newSwipe(message)"
                            v-show="index === messages.length - 1"
                            :disabled="pendingMessage || modelStore.loaded === false"
                            class="btn btn-sm btn-neutral">
                            <!-- prettier-ignore -->
                            <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- expanding spacer -->
        <div class="flex-grow" />

        <!-- Chat Controls -->
        <div class="flex md:px-2 md:pb-2 w-full max-w-[70em] ml-auto mr-auto">
            <!-- Context menu -->
            <button class="relative mr-2" @click.stop="toggleCtxMenu" @blur="showCtxMenu = false">
                <!-- prettier-ignore -->
                <svg class="w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
                </svg>
                <Transition name="fade">
                    <ul class="menu absolute bottom-16 bg-base-300 w-40 rounded-box" v-show="showCtxMenu">
                        <li><a @click="impersonate()">Impersonate</a></li>
                    </ul>
                </Transition>
            </button>

            <textarea
                ref="inputElement"
                id="message-input"
                v-model="currentMessage"
                @keydown.exact.enter="fullSend"
                class="textarea textarea-bordered border-2 resize-none flex-1 textarea-xs align-middle text-base h-20 focus:outline-none focus:border-primary" />

            <button
                @click="fullSend"
                :disabled="!modelStore.loaded"
                v-show="!pendingMessage"
                class="btn btn-primary align-middle md:ml-3 ml-[4px] h-20 md:w-32">
                {{ pendingMessage ? '' : 'Send' }}
                <span class="loading loading-spinner loading-md" :class="{hidden: !pendingMessage}" />
            </button>
            <button
                @click="stopGeneration"
                v-show="pendingMessage !== false"
                class="btn btn-neutral align-middle md:ml-3 ml-[4px] h-20 md:w-32">
                Stop
            </button>
        </div>
    </main>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.messageText p {
    color: var(--msg);
}

.messageText em {
    @apply text-base-content/80;
}

.messageText q {
    color: var(--quote);
}

/* Fix wrapping for code blocks */
code {
    white-space: pre-wrap;
}
</style>
