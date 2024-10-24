import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox'
import type {FastifyPluginAsync} from 'fastify'
import {Type as t} from '@sinclair/typebox'
import {eq} from 'drizzle-orm'
import {Template} from '@huggingface/jinja'
import {db, Message, Chat, User} from '../db.js'
import {logger} from '../logging.js'
// import {env} from '../env.js'
import {llamaChat, formatMessage} from './llama-cpp.js'

export const messageRoutes: FastifyPluginAsync = async (fastify) => {
    const f = fastify.withTypeProvider<TypeBoxTypeProvider>()

    f.route({
        url: '/create-message',
        method: 'POST',
        schema: {
            operationId: 'CreateMessage',
            tags: ['messages'],
            summary: 'Add a message to the chat',
            body: t.Object({
                chatId: t.Number(),
                characterId: t.Number(),
                text: t.String(),
                type: t.Union([t.Literal('user'), t.Literal('model'), t.Literal('system')]),
            }),
            response: {
                200: t.Object({
                    messageId: t.Number(),
                }),
            },
        },
        handler: async (request) => {
            const {chatId, characterId, type, text} = request.body
            logger.info('Creating message', `chatId: ${chatId} characterId: ${characterId} type: ${type} text: ${text}`)
            try {
                const [newMessage] = await db
                    .insert(Message)
                    .values({chatId, characterId, type, activeIndex: 0, content: [text]})
                    .returning({id: Message.id})

                return {messageId: newMessage.id}
            } catch (err) {
                // TODO proper error handling
                logger.error(err)
                throw new Error('Failed to create message')
            }
        },
    })

    f.route({
        url: '/update-message/:id',
        method: 'POST',
        schema: {
            operationId: 'UpdateMessage',
            tags: ['messages'],
            summary: 'Update an existing message',
            params: t.Object({id: t.String()}),
            body: t.Object({
                text: t.String(),
            }),
        },
        handler: async (req) => {
            const message = await db.query.Message.findFirst({
                where: eq(Message.id, Number(req.params.id)),
            })
            if (!message) {
                throw new Error('Message not found')
            }
            const content = message.content
            content[message.activeIndex] = req.body.text
            await db
                .update(Message)
                .set({content})
                .where(eq(Message.id, Number(req.params.id)))
        },
    })

    f.route({
        url: '/delete-message/:id',
        method: 'POST',
        schema: {
            operationId: 'DeleteMessage',
            tags: ['messages'],
            summary: 'Delete a Message',
            params: t.Object({id: t.String()}),
        },
        handler: async (req) => {
            await db.delete(Message).where(eq(Message.id, Number(req.params.id)))
        },
    })

    f.route({
        url: '/generate-message',
        method: 'POST',
        schema: {
            operationId: 'GenerateMessage',
            tags: ['messages'],
            summary: 'Generate a new response message',
            body: t.Object({
                chatId: t.Number(),
            }),
            produces: ['text/event-stream'],
            response: {
                200: t.String({description: 'data: {text}'}),
            },
        },
        handler: async (request, reply) => {
            const {chatId} = request.body

            // Setup headers for server-sent events
            reply.raw.setHeader('Content-Type', 'text/event-stream')
            reply.raw.setHeader('Cache-Control', 'no-store')
            reply.raw.setHeader('Connection', 'keep-alive')
            reply.raw.setHeader('Access-Control-Allow-Origin', '*')

            const controller = new AbortController()
            request.socket.on('close', () => {
                logger.debug('User disconnected')
                controller.abort()
            })

            const chat = await db.query.Chat.findFirst({
                where: eq(Chat.id, chatId),
                with: {
                    characters: {with: {character: true}},
                    lore: {with: {lore: true}},
                    messages: true,
                },
            })

            if (!chat) {
                return reply.status(404).send('Chat not found')
            }

            const userSettings = await db.query.User.findFirst({
                where: eq(User.id, 1),
                with: {promptTemplate: true, generatePreset: true},
            })

            if (!userSettings) {
                throw new Error('Could not get user settings')
            }
            const {generatePreset} = userSettings
            if (!generatePreset) {
                throw new Error('Could not get generation settings')
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
                throw new Error(`Could not parse system prompt: ${err}`)
            }
            logger.debug('System Instruction', systemPrompt)

            const chatHistory = llamaChat.chatWrapper.generateInitialChatHistory({systemPrompt})

            // Add messages to the chat history in reversed order
            const messagesReversed = chat.messages.toReversed()
            for (let i = 0; i < messagesReversed.length; i += 1) {
                const message = messagesReversed[i]
                const formattedMessage = formatMessage({
                    type: message.type,
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
            logger.info('prompt', contextState.contextText.toString())
            logger.info('tokens', tokens.length)

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
                    signal: controller.signal,
                    onTextChunk: async (chunk) => {
                        bufferedResponse += chunk
                        reply.raw.write(`event:text\ndata: ${JSON.stringify({text: bufferedResponse})}\n\n`)
                        await db
                            .update(Message)
                            .set({content: lastMessage.content})
                            .where(eq(Message.id, lastMessage.id))
                    },
                    stopOnAbortSignal: true,
                })

                bufferedResponse = bufferedResponse.trim()
                logger.debug('Response', bufferedResponse)
                lastMessage.content[lastMessage.activeIndex] = bufferedResponse
                await db.update(Message).set({content: lastMessage.content}).where(eq(Message.id, lastMessage.id))

                reply.raw.write(`event:final\ndata: ${JSON.stringify({text: bufferedResponse})}\n\n`)
            } catch (err) {
                logger.error('Failed to generate response')
                logger.error(err)
                reply.raw.write(`event: error\ndata: ${JSON.stringify({error: 'Failed to generate response'})}\n\n`)
            } finally {
                // All done
                request.socket.removeAllListeners('close')
                reply.raw.end()
                request.socket.destroy()
            }
        },
    })
}
