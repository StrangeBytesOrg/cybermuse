<script lang="ts" setup>
import {ref, reactive, watch} from 'vue'
import {useRoute} from 'vue-router'
import {Liquid} from 'liquidjs'
import {Bars4Icon, ExclamationTriangleIcon} from '@heroicons/vue/24/outline'
import {streamText} from 'ai'
import {createOpenAICompatible} from '@ai-sdk/openai-compatible'
import {chatCollection, characterCollection, loreCollection, templateCollection, generationPresetCollection} from '@/db'
import {useSettingsStore} from '@/store'
import Message from '@/components/message.vue'
import Thumbnail from '@/components/thumbnail.vue'
import router from '@/router'
import {ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon, TrashIcon} from '@heroicons/vue/24/outline'

const route = useRoute()
const settings = useSettingsStore()
const chatId = route.params.id
const currentMessage = ref(localStorage.getItem(`chat-draft-${chatId}`) || '') // Load saved draft from localStorage
const pendingMessage = ref(false)
const showCtxMenu = ref(false)
let abortController = new AbortController()

watch(currentMessage, (newVal) => {
    localStorage.setItem(`chat-draft-${chatId}`, newVal)
})

if (!chatId || Array.isArray(chatId)) {
    router.push({name: 'chats'})
    throw new Error('Invalid chat ID')
}

const chat = reactive(await chatCollection.get(chatId))
const characters = await characterCollection.whereIn(chat.characters)
const userCharacter = await characterCollection.get(chat.userCharacter)
const lore = await loreCollection.whereIn(chat.lore)
const characterMap = Object.fromEntries(characters.map((c) => [c.id, c]))

const updateChat = async () => {
    await chatCollection.put(chat)
}

const fullSend = async (event: KeyboardEvent | MouseEvent) => {
    event.preventDefault()

    if (pendingMessage.value) throw new Error('Message already in progress')
    if (!settings.generationServer) throw new Error('No generation server set')
    if (!settings.generationModel) throw new Error('No generation model set')

    // Only create a new user message if there is text
    if (currentMessage.value !== '') {
        await createMessage(userCharacter.id, currentMessage.value, 'user')
    }

    const otherCharacters = characters.filter((c) => c.id !== userCharacter.id)
    if (otherCharacters.length > 1) {
        console.log('TODO - Pick respondent using LLM')
    } else if (otherCharacters.length === 1) {
        console.log('Using only character')
        if (!otherCharacters[0]) throw new Error('Missing character')
        createMessage(otherCharacters[0].id, '', 'assistant')
    }

    await generateMessage()
}

const impersonate = async () => {
    if (pendingMessage.value) throw new Error('Message already in progress')
    await createMessage(userCharacter.id, '', 'user')
    await generateMessage()
}

type MessageRoles = 'system' | 'user' | 'assistant'
const createMessage = async (characterId: string, text: string = '', type: MessageRoles) => {
    chat.messages.push({
        id: Math.random().toString(36).slice(2),
        characterId,
        type,
        content: [text],
        activeIndex: 0,
    })
    await updateChat()

    currentMessage.value = ''
    localStorage.removeItem(`chat-draft-${chatId}`)
}

const getSystemPrompt = async (): Promise<string> => {
    const engine = new Liquid()
    const {template} = await templateCollection.get(settings.template)

    // Render each character description
    characters.forEach((c) => {
        c.description = engine.parseAndRenderSync(c.description, {
            char: c.name,
            user: userCharacter.name,
        })
    })

    // Render User Character description
    userCharacter.description = engine.parseAndRenderSync(userCharacter.description, {
        char: userCharacter.name,
    })

    // Add the user character to the list of characters
    let characterString = characters.map((c) => `${c.name}: ${c.description}`).join('\n')
    characterString += `${userCharacter.name}: ${userCharacter.description}\n`

    let loreString = ''
    lore.forEach((book) => {
        loreString += `${book.name}\n`
        book.entries.forEach((entry) => {
            loreString += `${entry.name}: ${entry.content}\n`
        })
    })

    // Render the system prompt
    return engine.parseAndRenderSync(template, {
        characters: characterString,
        lore: loreString || undefined,
    })
}

const generateMessage = async () => {
    pendingMessage.value = true

    try {
        const systemPrompt = await getSystemPrompt()
        const chatHistory = chat.messages.map((message) => {
            const prefix = `${characterMap[message.characterId]?.name || 'Missing Character'}: `
            return {
                role: message.type,
                content: prefix + (message.content[message.activeIndex] || ''),
            }
        })
        chatHistory.pop() // Remove the last empty placeholder message

        const generationPreset = await generationPresetCollection.get(settings.preset)
        if (!settings.generationServer) throw new Error('No generation server set')
        if (!settings.generationModel) throw new Error('No generation model set')
        const endpoint = createOpenAICompatible({
            name: settings.generationProvider ?? 'unset',
            baseURL: settings.generationServer,
            apiKey: settings.generationKey ?? '',
        })
        const {textStream} = streamText({
            model: endpoint(settings.generationModel),
            system: systemPrompt,
            messages: chatHistory,
            seed: generationPreset.seed,
            temperature: generationPreset.temperature,
            topP: generationPreset.topP,
            topK: generationPreset.topK,
            maxOutputTokens: generationPreset.maxTokens,
            frequencyPenalty: generationPreset.frequencyPenalty,
            presencePenalty: generationPreset.presencePenalty,
            abortSignal: abortController.signal,
            // TODO: Add stop sequences
        })
        let messageBuffer = ''
        for await (const text of textStream) {
            messageBuffer += text
            const lastMessage = chat.messages[chat.messages.length - 1]
            if (!lastMessage) throw new Error('No last message')

            const charName = characterMap[lastMessage.characterId]?.name
            if (charName) {
                const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                const escaped = escapeRegex(charName)
                const labelPattern = new RegExp(`(^|\\n)(?:${escaped}\\s*:)+\\s*`, 'gi')
                messageBuffer = messageBuffer.replace(labelPattern, (_m, boundary) => boundary)
            }

            lastMessage.content[lastMessage.activeIndex] = messageBuffer.trim()
            await updateChat()
        }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
        throw error
    } finally {
        pendingMessage.value = false
    }
}

const newSwipe = async (messageId: string) => {
    if (pendingMessage.value) throw new Error('Message already in progress')
    if (!settings.generationServer) throw new Error('No generation server set')
    if (!settings.generationModel) throw new Error('No generation model set')

    const message = chat.messages.find((m) => m.id === messageId)
    if (!message) throw new Error('Message not found')
    message.content.push('')
    message.activeIndex = message.content.length - 1
    await updateChat()
    await generateMessage()
}

const swipeLeft = async (messageId: string) => {
    const message = chat.messages.find((m) => m.id === messageId)
    if (message && message.activeIndex > 0) {
        message.activeIndex -= 1
        await updateChat()
    }
}

const swipeRight = async (messageId: string) => {
    const message = chat.messages.find((m) => m.id === messageId)
    if (message && message.activeIndex < message.content.length - 1) {
        message.activeIndex += 1
        await updateChat()
    }
}

const deleteMessage = async (messageId: string) => {
    const messageIndex = chat.messages.findIndex((m) => m.id === messageId)
    if (messageIndex === -1) throw new Error('Message not found')
    chat.messages.splice(messageIndex, 1)
    await updateChat()
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
        <div class="flex flex-grow flex-col-reverse overflow-y-auto px-1 md:px-2 w-full max-w-[70em] ml-auto mr-auto">
            <div v-for="(message, index) in chat.messages.slice().reverse()" :key="message.id" class="flex flex-col relative mt-2 bg-base-200 rounded-xl">
                <!-- Message Content -->
                <div class="flex flex-row pb-2 pt-2">
                    <div class="w-18 min-w-18 pl-2">
                        <Thumbnail
                            v-if="characterMap[message.characterId]?.avatar"
                            :image="characterMap[message.characterId]?.avatar ?? '/assets/img/placeholder-avatar.webp'"
                            :width="512"
                            :height="512"
                            class="w-full rounded"
                            alt="character avatar"
                        />
                        <img v-else src="@/assets/img/placeholder-avatar.webp" class="w-full rounded" alt="character avatar" />
                    </div>

                    <!-- Delete -->
                    <button class="btn btn-square btn-sm absolute top-1 right-11" @click="deleteMessage(message.id)">
                        <TrashIcon class="size-6" />
                    </button>

                    <div class="flex flex-col flex-grow px-2">
                        <div class="font-bold">
                            {{ characterMap[message.characterId]?.name || 'Missing Character' }}
                        </div>
                        <Message v-if="chat.messages[index]" v-model="message.content[message.activeIndex]" @update="updateChat" />
                    </div>
                </div>

                <!-- Swipe Controls -->
                <div v-if="index === 0" class="flex flex-row justify-between px-1 pb-1">
                    <!-- Swipe Left -->
                    <div class="flex w-16">
                        <button @click="swipeLeft(message.id)" v-show="message.activeIndex > 0" class="btn btn-sm">
                            <ChevronLeftIcon class="size-6 /" />
                        </button>
                    </div>

                    <!-- Swipe Count -->
                    <div class="flex" v-show="message.content.length > 1">
                        {{ message.activeIndex + 1 }} / {{ message.content.length }}
                    </div>

                    <!-- Swipe Right / Regen -->
                    <div class="flex w-16 justify-end">
                        <button
                            @click="swipeRight(message.id)"
                            v-show:="message.activeIndex < message.content.length - 1"
                            class="btn btn-sm">
                            <ChevronRightIcon class="size-6" />
                        </button>
                        <button @click="newSwipe(message.id)" class="btn btn-sm">
                            <ArrowPathIcon class="size-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Chat Controls -->
        <div v-if="!settings.generationServer" class="alert alert-warning m-1" role="alert">
            <ExclamationTriangleIcon class="size-6" />
            Select a generation server in settings
        </div>
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
                id="message-input"
                v-model="currentMessage"
                @keydown.exact.enter="fullSend"
                class="textarea border-2 resize-none flex-1 align-middle h-20 focus:border-primary"
            />

            <button
                @click="fullSend"
                v-show="!pendingMessage"
                class="btn btn-primary align-middle md:ml-3 ml-[4px] h-20 md:w-32">
                {{ pendingMessage ? '' : 'Send' }} <span class="loading loading-spinner loading-md" :class="{hidden: !pendingMessage}" />
            </button>
            <button
                @click="stopGeneration"
                v-show="pendingMessage !== false"
                class="btn align-middle md:ml-3 ml-[4px] h-20 md:w-32">
                Stop
            </button>
        </div>
    </div>
</template>
