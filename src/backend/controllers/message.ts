import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox'
import type {FastifyPluginAsync} from 'fastify'
import {Type as t} from '@sinclair/typebox'
import {eq} from 'drizzle-orm'
import {Template} from '@huggingface/jinja'
import {db, Message, Chat, User} from '../db.js'
import {logger} from '../logging.js'
// import {env} from '../env.js'
// import {currentTemplate} from './llama-server.js'
import {LlamaChat} from 'node-llama-cpp'
import {context} from './llama-cpp.js'

export const messageRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
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
                generated: t.Boolean(),
            }),
            response: {
                200: t.Object({
                    messageId: t.Number(),
                }),
            },
        },
        handler: async (request) => {
            const {chatId, characterId, generated, text} = request.body
            console.log(
                `Creating message, chatId: ${chatId} characterId: ${characterId} generated: ${generated} text: ${text}`,
            )
            try {
                const [newMessage] = await db
                    .insert(Message)
                    .values({chatId, characterId, generated, activeIndex: 0, content: [text]})
                    .returning({id: Message.id})

                return {messageId: newMessage.id}
            } catch (err) {
                // TODO proper error handling
                logger.error(err)
                throw new Error('Failed to create message')
            }
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
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

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
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

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
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

            const llamaChat = new LlamaChat({
                contextSequence: context.getSequence(),
                autoDisposeSequence: true,
            })

            const chatHistory = llamaChat.chatWrapper.generateInitialChatHistory({systemPrompt})

            // TODO implement token limit
            chat.messages.forEach((message) => {
                if (message.generated) {
                    chatHistory.push({
                        type: 'model',
                        response: [
                            `${characterMap.get(message.characterId).name}: ${message.content[message.activeIndex]}`,
                        ],
                    })
                } else {
                    chatHistory.push({
                        type: 'user',
                        text: `${characterMap.get(message.characterId).name}: ${message.content[message.activeIndex]}`,
                    })
                }
            })

            logger.debug('chat history', chatHistory)

            let bufferedResponse = ''
            try {
                await llamaChat.generateResponse(chatHistory, {
                    maxTokens: generatePreset.maxTokens,
                    minP: generatePreset.minP || undefined,
                    seed: generatePreset.seed,
                    temperature: generatePreset.temperature,
                    topK: generatePreset.topK || undefined,
                    topP: generatePreset.topP || undefined,
                    // repeatPenalty: 0,
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
                await llamaChat.dispose()

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

    // fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    //     url: '/get-response-character',
    //     method: 'POST',
    //     schema: {
    //         operationId: 'GetResponseCharacter',
    //         tags: ['messages'],
    //         summary: 'Use the loaded model to select a character to respond',
    //         body: t.Object({
    //             chatId: t.Number(),
    //         }),
    //         response: {
    //             200: t.Object({
    //                 characterId: t.Number(),
    //             }),
    //             default: t.Object({
    //                 message: t.String(),
    //             }),
    //         },
    //     },
    //     handler: async (request, reply) => {
    //         const {chatId} = request.body

    //         // const controller = new AbortController()
    //         const existingChat = await db.query.Chat.findFirst({
    //             where: eq(Chat.id, chatId),
    //             with: {
    //                 characters: {with: {character: true}},
    //                 messages: true,
    //             },
    //         })
    //         if (!existingChat) {
    //             return reply.status(404).send({message: 'Chat not found.'})
    //         }

    //         const userCharacter = existingChat?.characters.find(({character}) => character.type === 'user')
    //         const userSettings = await db.query.User.findFirst({
    //             where: eq(User.id, 1),
    //             with: {promptTemplate: true, generatePreset: true},
    //         })
    //         if (!userSettings) {
    //             return reply.status(500).send({message: 'User not found'})
    //         }
    //         const promptTemplate = userSettings.promptTemplate
    //         const generatePreset = userSettings.generatePreset
    //         if (!promptTemplate) {
    //             return reply.status(500).send({message: 'No prompt template found'})
    //         }
    //         if (!generatePreset) {
    //             return reply.status(500).send({message: 'No generate preset found'})
    //         }

    //         // Format the messages and characters for the template
    //         const formattedMessages = existingChat?.messages.map((message) => {
    //             const messageCharacter = existingChat.characters.find(
    //                 ({character}) => character.id === message.characterId,
    //             )
    //             return {
    //                 text: message.content[message.activeIndex],
    //                 generated: message.generated,
    //                 role: message.generated ? 'assistant' : 'user',
    //                 character: messageCharacter?.character,
    //             }
    //         })
    //         const formattedCharacters = existingChat?.characters.map(({character}) => {
    //             character.description = new Template(character.description).render({
    //                 char: character.name,
    //                 user: userCharacter?.character.name || 'User',
    //             })
    //             return character
    //         })

    //         const tokenLimit = generatePreset.context
    //         let prompt = ''
    //         let tokenCount = 0
    //         const promptStartTime = Date.now()
    //         try {
    //             for (let i = formattedMessages.length - 1; i >= 0; i -= 1) {
    //                 const messagesSubset = formattedMessages.slice(i, formattedMessages.length - 1)
    //                 const chatTemplate = new Template(promptTemplate.chatTemplate || '')
    //                 const newPrompt = chatTemplate.render({
    //                     messages: messagesSubset,
    //                     characters: formattedCharacters,
    //                 })
    //                 tokenCount = await getTokenCount(prompt)
    //                 if (tokenCount < tokenLimit) {
    //                     prompt = newPrompt
    //                 } else {
    //                     logger.debug(`Token limit reached: ${tokenCount}`)
    //                     break
    //                 }
    //             }
    //         } catch (err) {
    //             logger.error(`Failed to render template`)
    //             logger.error(err)
    //             return reply.status(500).send({message: 'Failed to create character picking'})
    //         }
    //         const promptTime = Date.now() - promptStartTime
    //         logger.info(`Character Picking prompt time: ${(promptTime / 1000).toFixed(2)}s`)

    //         const notUserCharacters = existingChat?.characters.filter(({character}) => character.type === 'character')
    //         const characterNames = notUserCharacters?.map(({character}) => `"${character.name}"`)
    //         const gbnfNameString = characterNames.join(' | ')
    //         const gram = `root ::= ( ${gbnfNameString} )`
    //         logger.info(`Grammar: ${gram}`)

    //         try {
    //             const startTime = Date.now()
    //             const response = await fetch(`${llamaCppBaseUrl}/completion`, {
    //                 method: 'POST',
    //                 // signal: controller.signal,
    //                 body: JSON.stringify({
    //                     stream: false,
    //                     cache_prompt: true,
    //                     prompt,
    //                     grammar: gram,
    //                     n_predict: 8,
    //                     n_probs: 3, // Get the top 3 probabilities picked
    //                     seed: generatePreset.seed,
    //                     temperature: generatePreset.temperature,
    //                     top_k: generatePreset.topK,
    //                     top_p: generatePreset.topP,
    //                     min_p: generatePreset.minP,
    //                     tfs_z: generatePreset.tfsz,
    //                     typical_p: generatePreset.typicalP,
    //                     repeat_penalty: generatePreset.repeatPenalty,
    //                     repeat_last_n: generatePreset.repeatLastN,
    //                     penalize_nl: generatePreset.penalizeNL,
    //                     presence_penalty: generatePreset.presencePenalty,
    //                     frequency_penalty: generatePreset.frequencyPenalty,
    //                     mirostat: generatePreset.mirostat,
    //                     mirostat_tau: generatePreset.mirostatTau,
    //                     mirostat_eta: generatePreset.mirostatEta,
    //                 }),
    //             })
    //             const generationTime = Date.now() - startTime
    //             logger.info(`Response time: ${(generationTime / 1000).toFixed(1)}s`)
    //             const responseData = await response.json()
    //             // logger.info(responseData)
    //             const pickedCharacterName = responseData.content
    //             const pickedCharacter = notUserCharacters.find(({character}) => character.name === pickedCharacterName)
    //             if (!pickedCharacter) {
    //                 return reply.status(500).send({message: 'Failed to get response character'})
    //             }
    //             logger.info(pickedCharacter)
    //             return {characterId: pickedCharacter.characterId}
    //         } catch (err) {
    //             logger.error('Failed to generate response')
    //             logger.error(err)
    //             return reply.status(500).send({message: 'oh no'})
    //         }
    //     },
    // })
}
