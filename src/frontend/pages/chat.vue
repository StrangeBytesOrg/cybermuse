<script lang="ts" setup>
import {ref} from 'vue'
import {useRoute} from 'vue-router'
import {useToast} from 'vue-toastification'
import {Template} from '@huggingface/jinja'
import {Bars4Icon} from '@heroicons/vue/24/outline'
import {characterCollection, loreCollection, templateCollection, generationPresetCollection, userCollection} from '@/db'
import {useChatStore, useConnectionStore} from '@/store'
import Message from '@/components/message.vue'
import router from '@/router'
import {responseToIterable} from '../lib/sse'

const route = useRoute()
const toast = useToast()
const chatStore = useChatStore()
const connectionStore = useConnectionStore()
const chatId = route.params.id
const currentMessage = ref('')
const pendingMessage = ref(false)
const messagesElement = ref<HTMLElement>()
const showCtxMenu = ref(false)
let abortController = new AbortController()

// Check if API connection is good
const checkFetch = await fetch(connectionStore.connectionUrl + '/health')
const checkRes = await checkFetch.json()
console.log(checkRes)
if (checkRes.status !== 'ok') {
    toast.error('Not connected to a generation API')
}
connectionStore.connected = true

if (!chatId || Array.isArray(chatId)) {
    router.push({name: 'chats'})
    throw new Error('Invalid chat ID')
}

await chatStore.getChat(chatId)
const chat = chatStore.chat
const characters = await characterCollection.find({
    selector: {
        _id: {$in: chat.characters},
    },
})
const userCharacter = await characterCollection.findById(chat.userCharacter)
const lore = await loreCollection.find({
    selector: {
        _id: {$in: chat.lore},
    },
})
const characterMap = Object.fromEntries(characters.map((c) => [c._id, c]))
characterMap[chat.userCharacter] = userCharacter

// Common setup function for generation
const setupGeneration = async () => {
    const {promptTemplateId, generatePresetId} = await userCollection.findById('default-user')
    const generatePreset = await generationPresetCollection.findById(generatePresetId)
    const template = await templateCollection.findById(promptTemplateId)
    const jinjaTemplate = new Template(template.template)

    // Render each character description
    characters.forEach((c) => {
        const characterTemplate = new Template(c.description)
        c.description = characterTemplate.render({char: c.name})
    })

    const systemPrompt = jinjaTemplate.render({characters, lore})
    const formattedMessages = chat.messages.map((message) => {
        const prefix = `${characterMap[message.characterId]?.name || 'Missing Character'}: `
        return {type: message.type, content: prefix + (message.content[message.activeIndex] || '')}
    })

    return {systemPrompt, formattedMessages, generatePreset}
}

const pickCharacter = async () => {
    // If there are no characters, throw an error
    if (chat.characters.length === 0) {
        throw new Error('Missing characters')
    }

    // If there's only one character, use that one
    if (chat.characters.length === 1 && chat.characters[0]) {
        return chat.characters[0]
    }

    // TODO implement
    throw new Error('Multiple characters not implemented')

    // For multiple characters, use GBNF to select one
    // pendingMessage.value = true
    // const {systemPrompt, formattedMessages, generatePreset} = await setupGeneration()

    // // Add empty message for response
    // formattedMessages.push({type: 'model', content: ''})

    // // Call generate, passing a grammar to be used for character picking
    // const gbnfString = 'root ::= ' + characters.map((c) => `"${c.name}"`).join(' | ')

    // const res = await client.generate.generateNonStreaming.mutate({
    //     systemPrompt,
    //     messages: formattedMessages,
    //     gbnfString,
    //     generationSettings: generatePreset,
    // })

    // const characterName = res.response
    // const character = characters.find((c) => c.name === characterName)
    // if (!character) {
    //     throw new Error('Character not found')
    // }
    // return character._id
}

const fullSend = async (event: KeyboardEvent | MouseEvent) => {
    event.preventDefault()

    if (pendingMessage.value) {
        throw new Error('Message already in progress')
    }
    if (!connectionStore.connected) {
        throw new Error('Not connected to generation server')
    }

    // Only create a new user message if there is text
    if (currentMessage.value !== '') {
        await createMessage(userCharacter._id, currentMessage.value, 'user')
    }

    // Create a new empty message for the response
    const characterId = await pickCharacter()
    await createMessage(characterId, '', 'model')

    await generateMessage()
}

const impersonate = async () => {
    if (pendingMessage.value) {
        throw new Error('Message already in progress')
    }
    if (!connectionStore.connected) {
        throw new Error('Generation server not running or not connected')
    }

    await createMessage(userCharacter._id, '', 'model')
    await generateMessage()
}

const createMessage = async (characterId: string, text: string = '', type: 'user' | 'model' | 'system') => {
    chat.messages.push({
        id: Math.random().toString(36).slice(2),
        characterId,
        type,
        content: [text],
        activeIndex: 0,
    })
    await chatStore.save()

    currentMessage.value = ''
}

const generateMessage = async () => {
    pendingMessage.value = true
    const lastMessage = chat.messages[chat.messages.length - 1]

    // Realistically this probably can't happen but it keeps TS happy
    if (!lastMessage) {
        throw new Error('No messages to generate into')
    }

    const chatCompletionUrl = connectionStore.connectionUrl + '/chat/completions'
    try {
        const {systemPrompt, formattedMessages, generatePreset} = await setupGeneration()

        const messages = []
        messages.push({
            role: 'system',
            content: systemPrompt,
        })
        formattedMessages.forEach((message) => {
            messages.push({
                role: message.type === 'user' ? 'user' : 'model',
                content: message.content,
            })
        })
        messages.pop()

        const response = await fetch(chatCompletionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: abortController.signal,
            body: JSON.stringify({
                stream: true,
                messages,
                n_predict: generatePreset.maxTokens,
                temperature: generatePreset.temperature,
                min_p: generatePreset.minP,
                top_p: generatePreset.topP,
                top_k: generatePreset.topK,
                // TODO add Penalties
            }),
        })
        const iterable = responseToIterable(response)
        let messageBuffer = ''
        for await (const chunk of iterable) {
            if (chunk.data !== '[DONE]') {
                const wat = JSON.parse(chunk.data)
                if (wat.choices[0].delta.content) {
                    messageBuffer += wat.choices[0].delta.content
                    lastMessage.content[lastMessage.activeIndex] = messageBuffer
                    await chatStore.save()
                }
            }
        }
        console.log(messageBuffer)
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
        throw error
    } finally {
        console.log('done pending')
        pendingMessage.value = false
    }
}

const newSwipe = async (messageIndex: number) => {
    if (pendingMessage.value) {
        throw new Error('Message already in progress')
    }
    const message = chat.messages[messageIndex]
    if (message) {
        message.content.push('')
        message.activeIndex = message.content.length - 1
        await chatStore.save()
        await generateMessage()
    }
}

const stopGeneration = () => {
    abortController.abort()
    pendingMessage.value = false
    abortController = new AbortController()
}

const toggleCtxMenu = () => {
    showCtxMenu.value = !showCtxMenu.value
}
</script>

<template>
    <main class="flex flex-col pt-2 min-h-[100vh] max-h-[100vh]">
        <!-- expanding spacer -->
        <div class="flex-grow" />

        <!-- Messages -->
        <div
            ref="messagesElement"
            class="flex flex-grow flex-col-reverse overflow-y-auto px-1 md:px-2 w-full max-w-[70em] ml-auto mr-auto">
            <Message
                v-for="(message, index) in chat.messages.slice().reverse()"
                v-bind:key="message.id"
                :index="chat.messages.length - 1 - index"
                :message="message"
                :characterMap="characterMap"
                :loading="false"
                :showSwipes="index === 0 && message.type === 'model'"
                @new-swipe="newSwipe" />
        </div>

        <!-- Chat Controls -->
        <div class="flex md:px-2 md:pb-2 w-full max-w-[70em] ml-auto mr-auto">
            <!-- Context menu -->
            <button class="relative mr-2" @click.stop="toggleCtxMenu" @blur="showCtxMenu = false">
                <Bars4Icon class="size-10" />
                <Transition
                    name="fade"
                    leave-to-class="opacity-0"
                    enter-from-class="opacity-0"
                    enter-active-class="transition duration-300"
                    leave-active-class="transition duration-300">
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
                :disabled="!connectionStore.connected"
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
