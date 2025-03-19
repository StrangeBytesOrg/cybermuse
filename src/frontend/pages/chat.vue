<script lang="ts" setup>
import {ref} from 'vue'
import {useRoute} from 'vue-router'
import Handlebars from 'handlebars'
import {useDexieLiveQuery} from '@strangebytes/vue-dexie-live-query'
import {Bars4Icon} from '@heroicons/vue/24/outline'
import {db} from '@/db'
import {useSettingsStore, useHubStore} from '@/store'
import {responseToIterable} from '@/lib/sse'
import client from '@/clients/gen-client'
import Message from '@/components/message.vue'
import router from '@/router'

// Function to wrap Dexie get calls with a throw on undefined
const getOrThrow = async <T>(promise: Promise<T | undefined>): Promise<T> => {
    const result = await promise
    if (!result) throw new Error('Not found')
    return result
}

const route = useRoute()
const settings = useSettingsStore()
const hubStore = useHubStore()
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

const chat = await useDexieLiveQuery(() => getOrThrow(db.chats.get(chatId)))
const characters = await getOrThrow(db.characters.where('id').anyOf(chat.value.characters).toArray())
const userCharacter = await getOrThrow(db.characters.get(chat.value.userCharacter))
const lore = await db.lore.where('id').anyOf(chat.value.lore).toArray()
const characterMap = Object.fromEntries(characters.map((c) => [c.id, c]))
characterMap[chat.value.userCharacter] = userCharacter
const allCharacter = [userCharacter, ...characters]

const fullSend = async (event: KeyboardEvent | MouseEvent) => {
    event.preventDefault()

    if (pendingMessage.value) {
        throw new Error('Message already in progress')
    }

    // Only create a new user message if there is text
    if (currentMessage.value !== '') {
        await createMessage(userCharacter.id, currentMessage.value, 'user')
    }

    await generateMessage()
}

const impersonate = async () => {
    if (pendingMessage.value) {
        throw new Error('Message already in progress')
    }

    await createMessage(userCharacter.id, '', 'model')
    await generateMessage(userCharacter.name)
}

const createMessage = async (characterId: string, text: string = '', type: 'user' | 'model' | 'system') => {
    chat.value.messages.push({
        id: Math.random().toString(36).slice(2),
        characterId,
        type,
        content: [text],
        activeIndex: 0,
    })
    await db.chats.put(chat.value)

    currentMessage.value = ''
}

const getSystemPrompt = async () => {
    const template = await getOrThrow(db.templates.get(settings.template))
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

    return systemPrompt
}

const generateMessage = async (respondent?: string) => {
    pendingMessage.value = true

    try {
        const systemPrompt = await getSystemPrompt()
        const chatHistory = chat.value.messages.map((message) => {
            const prefix = `${characterMap[message.characterId]?.name || 'Missing Character'}: `
            return {
                role: message.type,
                content: prefix + (message.content[message.activeIndex] || ''),
            }
        })

        const formattedMessages = [
            {role: 'system', content: systemPrompt},
            ...chatHistory,
        ]

        // If a respondent was specified, this is a regeneration, so the last message will be empty
        if (respondent) {
            formattedMessages.pop()
        }

        // Create a GBNF string to make sure the message starts with a pre-determined character, or one of the chat characters
        let nameString
        if (respondent) {
            nameString = `"${respondent}:"`
        } else {
            nameString = `(${characters.map((c) => `"${c.name}:"`).join(' | ')})`
        }
        const gbnfString = `root ::= ${nameString} [\\u0000-\\U0010FFFF]*`

        const generationPreset = await getOrThrow(db.generationPresets.get(settings.preset))
        const baseUrl = settings.connectionProvider === 'hub' ? import.meta.env.VITE_GEN_URL : settings.connectionServer
        const token = settings.connectionProvider === 'hub' ? hubStore.token : 'dummy-token'

        if (!baseUrl) throw new Error('No connection provider set')
        if (!token) throw new Error('No token set')

        const {response} = await client.POST('/chat/completions', {
            baseUrl,
            params: {header: {token}},
            body: {
                stream: true,
                grammar: gbnfString,
                messages: formattedMessages,
                n_predict: generationPreset.maxTokens,
                temperature: generationPreset.temperature,
                min_p: generationPreset.minP,
                top_p: generationPreset.topP,
                top_k: generationPreset.topK,
                // TODO add Penalties
                // TODO stop strings
            },
            signal: abortController.signal,
            parseAs: 'stream',
        })
        if (!response.ok) throw new Error('Connection to server failed')
        const iterable = responseToIterable(response)
        let messageBuffer = ''
        let initialBuffer = ''
        let characterPicked = false
        for await (const {data} of iterable) {
            if (data === '[DONE]') continue
            const content = JSON.parse(data).choices[0].delta.content
            if (!content) continue

            // Determine which character is speaking before outputting to the chat
            if (!characterPicked) {
                initialBuffer += content
                const character = allCharacter.find((c) => initialBuffer.includes(`${c.name}:`))
                if (character) {
                    console.log('Picked:', character.name)
                    characterPicked = true

                    // If a respondent was not specified we need to create a new message
                    if (!respondent) {
                        createMessage(character.id, '', 'model')
                    }
                }
            } else {
                messageBuffer += content
                const lastMessage = chat.value.messages[chat.value.messages.length - 1]
                if (!lastMessage) throw new Error('No last message') // This should never happen, but it keeps TS happy
                lastMessage.content[lastMessage.activeIndex] = messageBuffer.trim()
                await db.chats.update(chat.value.id, {messages: chat.value.messages})
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
    const message = chat.value.messages[messageIndex]
    if (message) {
        message.content.push('')
        message.activeIndex = message.content.length - 1
        await db.chats.put(chat.value)
        const characterName = characterMap[message.characterId]?.name
        await generateMessage(characterName)
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
    <div class="flex flex-col fixed top-0 bottom-0 left-0 right-0 pt-14 pb-22 pl-1 sm:pl-52">
        <!-- Messages -->
        <div
            ref="messagesElement"
            class="flex flex-grow flex-col-reverse overflow-y-auto px-1 md:px-2 w-full max-w-[70em] ml-auto mr-auto">
            <Message
                v-for="(message, index) in chat?.messages.slice().reverse()"
                v-bind:key="message.id"
                :index="chat.messages.length - 1 - index"
                :message="message"
                :chatId="chat.id"
                :characterMap="characterMap"
                :loading="false"
                :showSwipes="index === 0 && message.type === 'model'"
                @new-swipe="newSwipe"
            />
        </div>

        <!-- Chat Controls -->
        <div class="flex absolute bottom-0 left-0 sm:left-52 right-0 px-1 sm:pb-1 sm:pr-2 max-w-[70em] ml-auto mr-auto">
            <!-- Context menu -->
            <button class="relative mr-2 cursor-pointer" @click.stop="toggleCtxMenu" @blur="showCtxMenu = false">
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
    </div>
</template>
