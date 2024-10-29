import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {Template} from '@huggingface/jinja'
import {TRPCError} from '@trpc/server'
import {t} from '../trpc.js'
import {db, Message, Chat, User} from '../db/index.js'
import {logger} from '../logging.js'
import {llamaChat, formatMessage} from '../llama-cpp.js'

export const messageRouter = t.router({
    create: t.procedure
        .input(
            z.object({
                chatId: z.number(),
                characterId: z.number(),
                text: z.string(),
                type: z.enum(['user', 'model', 'system']),
            }),
        )
        .mutation(async ({input}) => {
            logger.info(
                'creating message',
                `chatId: ${input.chatId} characterId: ${input.characterId} type: ${input.type} text: ${input.text}`,
            )
            try {
                const [newMessage] = await db
                    .insert(Message)
                    .values({
                        chatId: input.chatId,
                        characterId: input.characterId,
                        type: input.type,
                        activeIndex: 0,
                        content: [input.text],
                    })
                    .returning({id: Message.id})
                return {messageId: newMessage.id}
            } catch (err) {
                logger.error(err)
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to create message',
                })
            }
        }),
    generate: t.procedure.input(z.number()).mutation(async function* ({input: chatId, signal}) {
        // const controller = new AbortController()
        if (signal) {
            signal.onabort = () => {
                logger.debug('abort signal')
                // controller.abort()
            }
        }

        const chat = await db.query.Chat.findFirst({
            where: eq(Chat.id, chatId),
            with: {
                characters: {with: {character: true}},
                lore: {with: {lore: true}},
                messages: true,
            },
        })

        if (!chat) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Chat not found',
            })
        }

        const userSettings = await db.query.User.findFirst({
            where: eq(User.id, 1),
            with: {promptTemplate: true, generatePreset: true},
        })

        if (!userSettings) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Could not get user settings',
            })
        }
        const {generatePreset} = userSettings
        if (!generatePreset) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Could not get generation settings',
            })
        }

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
        const characterMap = new Map()
        characters.forEach((character) => {
            characterMap.set(character.id, character)
        })
        // const responseCharacter = characterMap.get(lastMessage.characterId)

        // Parse character info, lore, and chat history into a system message
        let systemPrompt = ''
        try {
            const systemInstructionTemplate = new Template(userSettings.promptTemplate.template)
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

        // Add messages to the chat history in reversed order
        const messagesReversed = chat.messages.toReversed()
        for (let i = 0; i < messagesReversed.length; i += 1) {
            const message = messagesReversed[i]
            const formattedMessage = formatMessage({
                type: message.type,
                // TODO add character name prefix to messages
                content: message.content[message.activeIndex],
            })
            chatHistory.splice(1, 0, formattedMessage)

            const contextState = llamaChat.chatWrapper.generateContextState({chatHistory})
            const tokenCount = contextState.contextText.tokenize(llamaChat.model.tokenizer).length
            if (tokenCount + generatePreset.maxTokens > llamaChat.context.contextSize) {
                logger.debug(
                    'Token limit exceeded',
                    `${tokenCount} + ${generatePreset.maxTokens} (${tokenCount + generatePreset.maxTokens})`,
                )
                logger.debug('Removing oldest message')
                chatHistory.splice(1, 1)
                break
            }
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
                        // TODO bring back abort signal
                        // signal: controller.signal,
                        signal,
                        onTextChunk: async (chunk) => {
                            await db
                                .update(Message)
                                .set({content: lastMessage.content})
                                .where(eq(Message.id, lastMessage.id))
                            controller.enqueue(chunk)
                        },
                        stopOnAbortSignal: true,
                    })
                    controller.close()
                },
            })

            // TODO update DB during generation
            let bufferedResponse = ''
            const reader = chunkStream.getReader()
            while (true) {
                const {done, value} = await reader.read()
                if (done) break
                bufferedResponse += value
                yield bufferedResponse
            }

            bufferedResponse = bufferedResponse.trim()
            logger.debug('Response', bufferedResponse)
            lastMessage.content[lastMessage.activeIndex] = bufferedResponse
            await db.update(Message).set({content: lastMessage.content}).where(eq(Message.id, lastMessage.id))
            // TODO does this catch actually do anything useful now?
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
    update: t.procedure
        .input(
            z.object({
                id: z.number(),
                text: z.string(),
            }),
        )
        .mutation(async ({input}) => {
            const message = await db.query.Message.findFirst({
                where: eq(Message.id, input.id),
            })
            if (!message) {
                throw new Error('Message not found')
            }
            const content = message.content
            content[message.activeIndex] = input.text
            await db.update(Message).set({content}).where(eq(Message.id, input.id))
        }),
    delete: t.procedure.input(z.number()).mutation(async ({input: messageId}) => {
        await db.delete(Message).where(eq(Message.id, messageId))
    }),
})
