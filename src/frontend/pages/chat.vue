<script lang="ts" setup>
import {ref, nextTick, onMounted} from 'vue'
import {useRoute} from 'vue-router'
import {useToast} from 'vue-toastification'
import {characterCollection, loreCollection, templateCollection, generationPresetCollection, userCollection} from '@/db'
import {streamingClient} from '@/api-client'
import {useChatStore, useModelStore} from '@/store'
import {Template} from '@huggingface/jinja'
import {Bars4Icon} from '@heroicons/vue/24/outline'
import Message from '@/components/message.vue'
import router from '@/router'

const route = useRoute()
const toast = useToast()
const chatStore = useChatStore()
const modelStore = useModelStore()
const chatId = route.params.id
const currentMessage = ref('')
const pendingMessage = ref(false)
const messagesElement = ref<HTMLElement>()
let lastScrollTime = Date.now()
const showCtxMenu = ref(false)
let abortController = new AbortController()

// Check if a model is loaded on page load
await modelStore.getLoaded()
console.log('loaded: ', modelStore.loaded)

if (!chatId || Array.isArray(chatId)) {
    router.push({name: 'chats'})
    throw new Error('Invalid chat ID')
}

await chatStore.getChat(chatId)
const chat = chatStore.chat
const characters = await characterCollection.find()
const lore = await loreCollection.find()
const userCharacter = chat.userCharacter
const characterMap = Object.fromEntries(characters.map((c) => [c._id, c]))

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
    await chatStore.save()

    currentMessage.value = ''
    await nextTick()
    scrollMessages('smooth')
}

const generateMessage = async () => {
    pendingMessage.value = true
    const lastMessage = chat.messages[chat.messages.length - 1]

    if (!lastMessage) {
        // Realistically this probably can't happen but it keeps TS happy
        throw new Error('No messages to generate into')
    }

    try {
        const {promptTemplateId, generatePresetId} = await userCollection.findById('default-user')
        const generatePreset = await generationPresetCollection.findById(generatePresetId)
        const template = await templateCollection.findById(promptTemplateId)
        const jTemplate = new Template(template.template)
        const systemPrompt = jTemplate.render({characters, lore})
        console.log(`systemPrompt: ${systemPrompt}`)
        const formattedMessages = chat.messages.map((message) => {
            const prefix = `${characterMap[message.characterId]?.name || 'Missing Character'}: `
            return {type: message.type, content: prefix + (message.content[message.activeIndex] || '')}
        })

        const iterable = await streamingClient.generate.generate.mutate(
            {
                systemPrompt,
                messages: formattedMessages,
                generationSettings: generatePreset,
            },
            {signal: abortController.signal},
        )
        for await (const text of iterable) {
            lastMessage.content[lastMessage.activeIndex] = text.trim()
            await chatStore.save()
            scrollMessages('smooth')
        }
        await chatStore.save()
    } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.message === 'Invalid response or stream interrupted') return
        throw error
    } finally {
        console.log('done pending')
        scrollMessages('smooth')
        pendingMessage.value = false
    }
}

const stopGeneration = () => {
    abortController.abort()
    pendingMessage.value = false
    abortController = new AbortController()
}

const newSwipe = async (messageIndex: number) => {
    const message = chat.messages[messageIndex]
    if (pendingMessage.value) {
        toast.error('Message already in progress')
        return
    }
    if (message) {
        message.content.push('')
        message.activeIndex = message.content.length - 1
        await chatStore.save()
        await generateMessage()
    }
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
            <Message
                v-for="(message, index) in chat.messages"
                v-bind:key="index"
                :index="index"
                :message="message"
                :characterMap="characterMap"
                :loading="false"
                :showSwipes="index === chat.messages.length - 1 && message.type === 'model'"
                @new-swipe="newSwipe" />
        </div>

        <!-- expanding spacer -->
        <div class="flex-grow" />

        <!-- Chat Controls -->
        <div class="flex md:px-2 md:pb-2 w-full max-w-[70em] ml-auto mr-auto">
            <!-- Context menu -->
            <button class="relative mr-2" @click.stop="toggleCtxMenu" @blur="showCtxMenu = false">
                <Bars4Icon class="size-10" />
                <Transition name="fade">
                    <ul class="menu absolute bottom-16 bg-base-300 w-40 rounded-box" v-show="showCtxMenu">
                        <li><a @click="impersonate">Impersonate</a></li>
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
</style>
