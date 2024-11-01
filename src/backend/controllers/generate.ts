import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {Template} from '@huggingface/jinja'
import {TRPCError} from '@trpc/server'
import {t} from '../trpc.js'
import {db, Message, Chat, User} from '../db/index.js'
import {logger} from '../logging.js'
import {llamaChat, formatMessage} from '../llama-cpp.js'

export const generateRouter = t.router({
    generate: t.procedure.input(z.number()).mutation(async function* ({input: chatId, signal}) {
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

        const lastMessage = chat.messages[chat.messages.length - 1]
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
        logger.debug('System Instruction', systemPrompt)

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

        const contextState = llamaChat.chatWrapper.generateContextState({chatHistory})
        const tokens = contextState.contextText.tokenize(llamaChat.model.tokenizer)
        logger.debug('prompt', contextState.contextText.toString())
        logger.debug('tokens', tokens.length)

        try {
            const chunkStream = new ReadableStream({
                async start(controller) {
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
                        signal,
                        onTextChunk: (chunk) => controller.enqueue(chunk),
                        stopOnAbortSignal: true,
                    })
                    controller.close()
                },
            })

            let bufferedResponse = ''
            const reader = chunkStream.getReader()
            while (true) {
                const {done, value} = await reader.read()
                if (done) break
                bufferedResponse += value
                lastMessage.content[lastMessage.activeIndex] = bufferedResponse
                await db.update(Message).set({content: lastMessage.content}).where(eq(Message.id, lastMessage.id))
                yield bufferedResponse
            }

            logger.debug('Response', bufferedResponse)
            lastMessage.content[lastMessage.activeIndex] = bufferedResponse.trim()
            await db.update(Message).set({content: lastMessage.content}).where(eq(Message.id, lastMessage.id))
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
})
