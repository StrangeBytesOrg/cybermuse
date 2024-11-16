<script lang="ts" setup>
import {ref} from 'vue'
import {useRoute} from 'vue-router'
import {Template} from '@huggingface/jinja'
import {Bars4Icon} from '@heroicons/vue/24/outline'
import {characterCollection, loreCollection, templateCollection, generationPresetCollection, userCollection} from '@/db'
import {streamingClient, client} from '@/api-client'
import {useChatStore, useModelStore} from '@/store'
import Message from '@/components/message.vue'
import router from '@/router'

const route = useRoute()
const chatStore = useChatStore()
const modelStore = useModelStore()
const chatId = route.params.id
const currentMessage = ref('')
const pendingMessage = ref(false)
const messagesElement = ref<HTMLElement>()
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

const fullSend = async (event: KeyboardEvent | MouseEvent) => {
    event.preventDefault()

    if (pendingMessage.value) {
        throw new Error('Message already in progress')
    }
    if (!modelStore.loaded) {
        throw new Error('Generation server not running or not connected')
    }

    // Only create a new user message if there is text
    if (currentMessage.value !== '') {
        await createMessage(userCharacter._id, currentMessage.value, 'user')
    }

    let characterId
    if (chat.characters.length > 1) {
        characterId = await pickCharacter()
    } else if (chat.characters[0]) {
        characterId = chat.characters[0]
    } else {
        throw new Error('Missing characters')
    }

    // Create a new empty message for the response
    await createMessage(characterId, '', 'model')

    await generateMessage()
}

const impersonate = async () => {
    if (pendingMessage.value) {
        throw new Error('Message already in progress')
    }
    if (!modelStore.loaded) {
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
        }
        await chatStore.save()
    } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.message === 'Invalid response or stream interrupted') return
        throw error
    } finally {
        console.log('done pending')
        pendingMessage.value = false
    }
}

const pickCharacter = async () => {
    const {promptTemplateId, generatePresetId} = await userCollection.findById('default-user')
    const generatePreset = await generationPresetCollection.findById(generatePresetId)
    const template = await templateCollection.findById(promptTemplateId)
    const jTemplate = new Template(template.template)
    // Render each character description
    characters.forEach((c) => {
        const characterTemplate = new Template(c.description)
        c.description = characterTemplate.render({char: c.name})
    })
    const systemPrompt = jTemplate.render({characters, lore})
    const formattedMessages = chat.messages.map((message) => {
        const prefix = `${characterMap[message.characterId]?.name || 'Missing Character'}: `
        return {type: message.type, content: prefix + (message.content[message.activeIndex] || '')}
    })
    formattedMessages.push({type: 'model', content: ''})

    // Call generate, passing a grammar to be used for character picking
    const gbnfString = 'root ::= ' + characters.map((c) => `"${c.name}"`).join(' | ')

    const res = await client.generate.generateNonStreaming.mutate({
        systemPrompt,
        messages: formattedMessages,
        gbnfString,
        generationSettings: generatePreset,
    })

    const characterName = res.response
    const character = characters.find((c) => c.name === characterName)
    if (!character) {
        throw new Error('Character not found')
    }
    return character._id
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
