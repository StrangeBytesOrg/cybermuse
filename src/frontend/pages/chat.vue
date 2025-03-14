<script lang="ts" setup>
import {ref} from 'vue'
import {useRoute} from 'vue-router'
import Handlebars from 'handlebars'
import {Bars4Icon} from '@heroicons/vue/24/outline'
import {db} from '@/db'
import {useChatStore, useConnectionStore} from '@/store'
import Message from '@/components/message.vue'
import router from '@/router'
import {responseToIterable} from '../lib/sse'

const route = useRoute()
const chatStore = useChatStore()
const connectionStore = useConnectionStore()
const chatId = route.params.id
const currentMessage = ref('')
const pendingMessage = ref(false)
const messagesElement = ref<HTMLElement>()
const showCtxMenu = ref(false)
let abortController = new AbortController()

if (!chatId || Array.isArray(chatId)) {
    router.push({name: 'chats'})
    throw new Error('Invalid chat ID')
}

await chatStore.getChat(chatId)
const chat = chatStore.chat
const characters = await db.characters.where('id').anyOf(chat.characters).toArray()
const userCharacter = await db.characters.get(chat.userCharacter)
const lore = await db.lore.where('id').anyOf(chat.lore).toArray()
const characterMap = Object.fromEntries(characters.map((c) => [c.id, c]))
characterMap[chat.userCharacter] = userCharacter

// Common setup function for generation
const setupGeneration = async () => {
    const {promptTemplateId, generatePresetId} = await db.users.get('default-user')
    const generatePreset = await db.generationPresets.get(generatePresetId)
    const template = await db.templates.get(promptTemplateId)
    const hbTemplate = Handlebars.compile(template.template)

    // Render each character description
    characters.forEach((c) => {
        const characterTemplate = Handlebars.compile(c.description)
        c.description = characterTemplate({
            char: c.name,
            user: userCharacter.name,
        })
    })

    // Get character and lore strings
    let characterString = ''
    characters.forEach((character) => {
        characterString += `${character.name}: ${character.description}\n`
    })
    let loreString = ''
    lore.forEach((book) => {
        loreString += `${book.name}\n`
        book.entries.forEach((entry) => {
            loreString += `${entry.name}: ${entry.content}\n`
        })
    })

    // Render the system prompt
    const systemPrompt = hbTemplate({
        characters: characterString,
        lore: loreString,
    })

    const formattedMessages = chat.messages.map((message) => {
        const prefix = `${characterMap[message.characterId]?.name || 'Missing Character'}: `
        return {
            role: message.type,
            content: prefix + (message.content[message.activeIndex] || ''),
        }
    })

    formattedMessages.unshift({
        role: 'system',
        content: systemPrompt,
    })

    return {formattedMessages, generatePreset}
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

    // For multiple characters, use GBNF to select one
    pendingMessage.value = true
    const {formattedMessages} = await setupGeneration()

    // Call generate, passing a grammar to be used for character picking
    const gbnfString = 'root ::= ' + characters.map((c) => `"${c.name}"`).join(' | ')
    const chatCompletionUrl = connectionStore.connectionUrl + '/chat/completions'
    const response = await fetch(chatCompletionUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        signal: abortController.signal,
        body: JSON.stringify({
            stream: false,
            grammar: gbnfString,
            messages: formattedMessages,
            n_predict: 8,
        }),
    })
    const res = await response.json()
    const characterName = res.choices[0].message.content

    const character = characters.find((c) => c.name === characterName)
    if (!character) {
        throw new Error('Character not found')
    }
    return character.id
}

const fullSend = async (event: KeyboardEvent | MouseEvent) => {
    event.preventDefault()

    if (pendingMessage.value) {
        throw new Error('Message already in progress')
    }

    // Only create a new user message if there is text
    if (currentMessage.value !== '') {
        await createMessage(userCharacter.id, currentMessage.value, 'user')
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

    await createMessage(userCharacter.id, '', 'model')
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
        const {formattedMessages, generatePreset} = await setupGeneration()
        formattedMessages.pop()

        // Create a GBNF string to make sure the message starts with the character's name
        const characterName = characterMap[lastMessage.characterId]?.name
        const gbnfString = `root ::= "${characterName}:" [\\u0000-\\U0010FFFF]*`

        const response = await fetch(chatCompletionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: abortController.signal,
            body: JSON.stringify({
                stream: true,
                grammar: gbnfString,
                messages: formattedMessages,
                n_predict: generatePreset.maxTokens,
                temperature: generatePreset.temperature,
                min_p: generatePreset.minP,
                top_p: generatePreset.topP,
                top_k: generatePreset.topK,
                // TODO add Penalties
            }),
        })
        if (!response.ok) throw new Error('Connection to server failed')
        const iterable = responseToIterable(response)
        let messageBuffer = ''
        let initialBuffer = ''
        for await (const chunk of iterable) {
            if (chunk.data === '[DONE]') continue

            const responseText = JSON.parse(chunk.data)
            const content = responseText.choices[0].delta.content
            if (content) {
                if (!initialBuffer.includes(`${characterName}:`)) {
                    initialBuffer += content
                } else {
                    messageBuffer += content
                }
                lastMessage.content[lastMessage.activeIndex] = messageBuffer.trim()
                await chatStore.save()
            }
        }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
        throw error
    } finally {
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
    <main class="flex flex-col fixed top-0 bottom-0 left-0 right-0 pt-14 pb-22 pl-1 sm:pl-52">
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
                @new-swipe="newSwipe"
            />
        </div>

        <!-- Chat Controls -->
        <div class="flex absolute bottom-0 left-0 sm:left-52 right-0 px-1 sm:pb-1 sm:pr-2 max-w-[70em] ml-auto mr-auto">
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
                class="textarea border-2 resize-none flex-1 align-middle h-20 focus:border-primary"
            />

            <button
                @click="fullSend"
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
