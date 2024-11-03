import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {Template} from '@huggingface/jinja'
import {TRPCError, tracked} from '@trpc/server'
import {t} from '../trpc.js'
import {db, Message, Chat, User, Character} from '../db/index.js'
import {logger} from '../logging.js'
import {llamaChat, formatMessage, llama} from '../llama-cpp.js'

import EventEmitter, {on} from 'events'
const ee = new EventEmitter()

export const generateRouter = t.router({
    chat: t.procedure.input(z.number()).subscription(async function* ({input: chatId, signal}) {
        const eee = on(ee, `chat-${chatId}`, {signal}) // If signal is not passed in the listener will never be cancelled
        type ChatEvent =
            | {event: 'start' | 'done'}
            | {event: 'textChunk'; text: string}
            | {event: 'newMessage'; message: any}
        for await (const [data] of eee) {
            const sseId = Date.now().toString()
            yield tracked(sseId, data as ChatEvent)
        }
    }),
    generate: t.procedure.input(z.number()).query(async ({input: chatId, signal}) => {
        const chat = await db.query.Chat.findFirst({
            where: eq(Chat.id, chatId),
            with: {
                characters: {with: {character: true}},
                lore: {with: {lore: true}},
                messages: {with: {character: true}},
            },
        })
        if (!chat) {
            throw new TRPCError({code: 'NOT_FOUND', message: 'Chat not found'})
        }

        const userSettings = await db.query.User.findFirst({
            where: eq(User.id, 1),
            with: {promptTemplate: true, generatePreset: true},
        })
        if (!userSettings) {
            throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: 'Could not get user settings'})
        }
        const {generatePreset, promptTemplate} = userSettings

        // const lastMessage = chat.messages[chat.messages.length - 1]
        const characters = chat.characters.map((c) => c.character)
        const lore = chat.lore.map((l) => l.lore)
        const userCharacter = characters.find((c) => c.type === 'user') || {name: 'User'}

        // Parse character descriptions
        characters.forEach((character) => {
            const template = new Template(character.description)
            character.description = template.render({
                char: character.name,
                user: userCharacter.name,
            })
        })

        // Parse character info, lore, and chat history into a system message
        let systemPrompt = ''
        try {
            const systemInstructionTemplate = new Template(promptTemplate.template)
            systemPrompt = systemInstructionTemplate.render({
                characters,
                lore,
            })
        } catch (err) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Could not parse system prompt',
                cause: err,
            })
        }
        // logger.debug('System Instruction', systemPrompt)

        const chatHistory = llamaChat.chatWrapper.generateInitialChatHistory({systemPrompt})

        // Add messages to the chat history
        for (let i = 0; i < chat.messages.length; i += 1) {
            const message = chat.messages[i]
            const prefix = `${message.character.name}: `
            const formattedMessage = formatMessage({
                type: message.type,
                content: prefix + message.content[message.activeIndex],
            })
            chatHistory.push(formattedMessage)
        }

        // const contextState = llamaChat.chatWrapper.generateContextState({chatHistory})
        // const tokens = contextState.contextText.tokenize(llamaChat.model.tokenizer)
        // logger.debug('prompt', contextState.contextText.toString())
        // logger.debug('tokens', tokens.length)

        // TODO get the character from the character picking
        // Add a message for the new response
        const character = await db.query.Character.findFirst({
            where: eq(Character.id, 9),
        })
        const [newMessage] = await db
            .insert(Message)
            .values({chatId, characterId: character.id, type: 'model', content: [''], activeIndex: 0})
            .returning({
                id: Message.id,
                characterId: Message.characterId,
                content: Message.content,
                activeIndex: Message.activeIndex,
            })
        chatHistory.push({
            type: 'model',
            response: [`${character.name}: `],
        })
        ee.emit(`chat-${chatId}`, {event: 'newMessage', message: newMessage})

        ee.emit(`chat-${chatId}`, {event: 'start'})

        let bufferedResponse = ''
        try {
            await llamaChat.generateResponse(chatHistory, {
                maxTokens: generatePreset.maxTokens,
                temperature: generatePreset.temperature,
                seed: generatePreset.seed,
                topK: generatePreset.topK || undefined,
                topP: generatePreset.topP || undefined,
                minP: generatePreset.minP || undefined,
                repeatPenalty: {
                    penalty: generatePreset.repeatPenalty || undefined,
                    presencePenalty: generatePreset.presencePenalty || undefined,
                    frequencyPenalty: generatePreset.frequencyPenalty || undefined,
                    penalizeNewLine: generatePreset.penalizeNL || undefined,
                    lastTokens: generatePreset.repeatLastN || undefined,
                },
                // customStopTriggers:
                stopOnAbortSignal: true,
                signal,
                onTextChunk: async (chunk) => {
                    bufferedResponse += chunk
                    // lastMessage.content[lastMessage.activeIndex] = bufferedResponse
                    // await db.update(Message).set({content: lastMessage.content}).where(eq(Message.id, lastMessage.id))
                    ee.emit(`chat-${chatId}`, {event: 'textChunk', text: bufferedResponse})
                },
            })

            // logger.debug('Response', bufferedResponse)
            newMessage.content[newMessage.activeIndex] = bufferedResponse.trim()
            await db.update(Message).set({content: newMessage.content}).where(eq(Message.id, newMessage.id))

            // lastMessage.content[lastMessage.activeIndex] = bufferedResponse.trim()
            // await db.update(Message).set({content: lastMessage.content}).where(eq(Message.id, lastMessage.id))
            ee.emit(`chat-${chatId}`, {event: 'done'})
        } catch (err) {
            logger.error('Failed to generate response')
            logger.error(err)
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to generate response',
                cause: err,
            })
        }
    }),
    pickCharacter: t.procedure.input(z.number()).mutation(async ({input: chatId}) => {
        logger.info('picking character', chatId)

        const chat = await db.query.Chat.findFirst({
            where: eq(Chat.id, chatId),
            with: {
                characters: {with: {character: true}},
                lore: {with: {lore: true}},
                messages: {with: {character: true}},
            },
        })
        if (!chat) {
            throw new TRPCError({code: 'NOT_FOUND', message: 'Chat not found'})
        }

        const userSettings = await db.query.User.findFirst({
            where: eq(User.id, 1),
            with: {promptTemplate: true, generatePreset: true},
        })
        if (!userSettings) {
            throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: 'Could not get user settings'})
        }
        const {generatePreset, promptTemplate} = userSettings

        // const lastMessage = chat.messages[chat.messages.length - 1]
        const characters = chat.characters.map((c) => c.character)
        const lore = chat.lore.map((l) => l.lore)
        const userCharacter = characters.find((c) => c.type === 'user') || {name: 'User'}

        // Parse character descriptions
        characters.forEach((character) => {
            const template = new Template(character.description)
            character.description = template.render({
                char: character.name,
                user: userCharacter.name,
            })
        })

        // Parse character info, lore, and chat history into a system message
        let systemPrompt = ''
        try {
            const systemInstructionTemplate = new Template(promptTemplate.template)
            systemPrompt = systemInstructionTemplate.render({
                characters,
                lore,
            })
        } catch (err) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Could not parse system prompt',
                cause: err,
            })
        }

        const chatHistory = llamaChat.chatWrapper.generateInitialChatHistory({systemPrompt})

        // Add messages to the chat history
        for (let i = 0; i < chat.messages.length; i += 1) {
            const message = chat.messages[i]
            const prefix = `${message.character.name}: `
            const formattedMessage = formatMessage({
                type: message.type,
                content: prefix + message.content[message.activeIndex],
            })
            chatHistory.push(formattedMessage)
        }

        const grammar = await llama.createGrammar({
            grammar: 'root ::= ' + characters.map((c) => `"${c.name}"`).join(' | '),
        })
        logger.debug('grammar string', grammar.grammar)

        const {response} = await llamaChat.generateResponse(chatHistory, {
            maxTokens: generatePreset.maxTokens,
            temperature: generatePreset.temperature,
            seed: generatePreset.seed,
            topK: generatePreset.topK || undefined,
            topP: generatePreset.topP || undefined,
            minP: generatePreset.minP || undefined,
            repeatPenalty: {
                penalty: generatePreset.repeatPenalty || undefined,
                presencePenalty: generatePreset.presencePenalty || undefined,
                frequencyPenalty: generatePreset.frequencyPenalty || undefined,
                penalizeNewLine: generatePreset.penalizeNL || undefined,
                lastTokens: generatePreset.repeatLastN || undefined,
            },
            grammar,
        })
        logger.debug('picked character name', response)
        return response
    }),
})
