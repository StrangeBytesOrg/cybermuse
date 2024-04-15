<script lang="ts" setup>
import {reactive, ref, nextTick, watch, onMounted} from 'vue'
import {useRoute} from 'vue-router'
import snarkdown from 'snarkdown'
import {useToast} from 'vue-toastification'
import {client} from '../api-client'
import {responseToIterable} from '../lib/fetch-backend'

const route = useRoute()
const toast = useToast()
const chatId = route.query.id
const currentMessage = ref('')
const pendingMessage = ref(false)
const connectionStore = ref({connected: true}) // TODO use actual store
const editModeId = ref(0)
const messagesElement = ref<HTMLElement>()

const {data, error} = await client.GET('/api/chat/{id}', {
    params: {path: {id: String(chatId)}},
})

if (error) {
    console.error(error)
    toast.error('Failed to load chat')
}

const messages = reactive(data.messages ?? [])
const characterMap = new Map((data.chatCharacters ?? []).map(({character}) => [character.id, character]))

const getCharacter = (characterId: number | null) => {
    if (characterId === null) {
        return {id: null, name: 'Deleted Character', image: '../assets/img/placeholder-avatar.webp'}
    }

    const character = characterMap.get(characterId)
    if (character) {
        return character
    } else {
        return {id: null, name: 'Deleted Character', image: '../assets/img/placeholder-avatar.webp'}
    }
}

const checkSend = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        sendMessage()
    }
}

const sendMessage = async () => {
    const characterId = 1
    const {data, error} = await client.POST('/api/new-message', {
        body: {
            chatId: Number(chatId),
            characterId,
            text: currentMessage.value,
        },
    })

    if (error) {
        toast.error(error.message)
    }

    // TODO error handling
    if (data && data.success && data.id) {
        messages.push({
            id: data.id,
            text: currentMessage.value,
            characterId,
        })
        currentMessage.value = ''
    }
}

const getMessage = async () => {
    const {response} = await client.POST('/api/generate-message', {
        body: {
            chatId: Number(chatId),
        },
        parseAs: 'stream',
    })
    const responseIterable = responseToIterable(response)
    let bufferedResponse = ''
    for await (const chunk of responseIterable) {
        const data = JSON.parse(chunk.data)
        if (chunk.event === 'initial') {
            messages.push({
                id: data.id,
                text: '',
                characterId: data.characterId,
            })
        } else if (chunk.event === 'message') {
            console.log(data.text)
            bufferedResponse += data.text
            messages[messages.length - 1].text = bufferedResponse
        } else if (chunk.event === 'final') {
            console.log('End of response')
            console.log(bufferedResponse)
            bufferedResponse = ''
        } else {
            console.error('Unknown event', chunk)
        }
    }
}

const editMessage = async (messageId: number) => {
    if (editModeId.value === messageId) {
        cancelEdit()
    } else {
        editModeId.value = messageId
        // Focus the input
        // await nextTick()
        // const inputElement = document.getElementById(`message-input-${messageId}`) as HTMLTextAreaElement
        // inputElement.focus()
    }
}

const cancelEdit = () => {
    editModeId.value = 0
}

// const updateMessage = async () => {
//     const {error} = await client.POST('/api/update-message', {
//         body: {
//             id: 69,
//             text: 'wat',
//         },
//     })
//     if (error) {
//         toast.error(error.message || 'Failed updating message')
//     }
// }

const deleteMessage = async (messageId: number) => {
    await client.POST('/api/delete-message', {
        body: {
            id: messageId,
        },
    })

    messages.splice(
        messages.findIndex((message) => message.id === messageId),
        1,
    )
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
                            <!-- <img v-if="message.character?.image" :src="message.character?.image" /> -->
                            <img
                                v-if="getCharacter(message.characterId).image"
                                :src="getCharacter(message.characterId).image" />
                            <img v-else src="../assets/img/placeholder-avatar.webp" />
                        </div>
                    </div>
                    <div class="flex flex-col flex-grow px-2">
                        <div class="font-bold">
                            {{ getCharacter(message.characterId).name }}
                        </div>
                        <div
                            v-html="snarkdown(textGoesBrr(message.text))"
                            class="whitespace-pre-wrap mx-[-1px] mt-1 px-[1px] flex-grow" />
                    </div>
                </div>

                <!-- Message control buttons -->
                <div class="absolute top-1 right-1">
                    <!-- Delete -->
                    <button
                        v-if="editModeId == message.id"
                        class="btn btn-square btn-sm btn-error ml-2"
                        @click="deleteMessage(message.id)">
                        <!-- prettier-ignore -->
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    </button>
                    <!-- Edit -->
                    <button class="btn btn-square btn-sm btn-neutral ml-2" @click="editMessage(message.id)">
                        <!-- prettier-ignore -->
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                    </button>
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
            <button @click="getMessage" class="btn btn-primary align-middle md:ml-3 ml-[4px] h-20 md:w-32">
                Get Response
            </button>
        </div>
    </main>
</template>
