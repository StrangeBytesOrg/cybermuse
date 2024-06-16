import type {ZodTypeProvider} from 'fastify-type-provider-zod'
import type {FastifyPluginAsync} from 'fastify'
import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {Template} from '@huggingface/jinja'
import {db, message, chat, user} from '../db.js'
import {responseToIterable} from '../lib/sse.js'

export const messageRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/create-message',
        method: 'POST',
        schema: {
            summary: 'Add a message to the chat',
            body: z.object({
                chatId: z.number(),
                characterId: z.number(),
                text: z.string(),
                generated: z.boolean(),
            }),
            response: {
                200: z.object({
                    messageId: z.number().optional(),
                }),
            },
        },
        handler: async (request) => {
            const {chatId, characterId, generated, text} = request.body
            try {
                const [newMessage] = await db
                    .insert(message)
                    .values({chatId, characterId, generated, activeIndex: 0, content: [text]})
                    .returning({id: message.id})

                return {messageId: newMessage.id}
            } catch (err) {
                // TODO proper error handling
                console.error(err)
                throw new Error('Failed to create message')
            }
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/update-message/:id',
        method: 'POST',
        schema: {
            summary: 'Update an existing message',
            params: z.object({id: z.string()}),
            body: z.object({
                text: z.string(),
            }),
        },
        handler: async (req) => {
            const dbMessage = await db.query.message.findFirst({
                where: eq(message.id, Number(req.params.id)),
            })
            if (!dbMessage) {
                throw new Error('Message not found')
            }
            const content = dbMessage.content
            content[dbMessage.activeIndex] = req.body.text
            await db
                .update(message)
                .set({content})
                .where(eq(message.id, Number(req.params.id)))
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/delete-message/:id',
        method: 'POST',
        schema: {
            summary: 'Delete a Message',
            params: z.object({id: z.string()}),
        },
        handler: async (req) => {
            await db.delete(message).where(eq(message.id, Number(req.params.id)))
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/generate-message',
        method: 'POST',
        schema: {
            summary: 'Generate a new response message',
            body: z.object({
                chatId: z.number(),
                continue: z.boolean(),
            }),
            produces: ['text/event-stream'],
            response: {
                200: z.string().describe('data: {text}'),
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
                console.log('User disconnected')
                controller.abort()
            })

            const existingChat = await db.query.chat.findFirst({
                where: eq(chat.id, chatId),
                with: {
                    characters: {with: {character: true}},
                    messages: true,
                },
            })

            // Get the message response character
            const lastMessage = existingChat?.messages[existingChat.messages.length - 1]
            if (!lastMessage) {
                reply.raw.write(`event: error\ndata: ${JSON.stringify({error: 'No messages found'})}\n\n`)
                return
            }
            const pickedCharacter = existingChat?.characters.find(
                ({character}) => character.id === lastMessage.characterId,
            )
            console.log('Picked Character:', pickedCharacter)

            const userSettings = await db.query.user.findFirst({
                where: eq(user.id, 1),
                with: {promptTemplate: true, generatePreset: true},
            })
            if (!userSettings) {
                reply.raw.write(`event: error\ndata: ${JSON.stringify({error: 'No user settings found'})}\n\n`)
                return
            }
            const promptTemplate = userSettings.promptTemplate
            const generatePreset = userSettings.generatePreset
            if (!promptTemplate) {
                reply.raw.write(`event: error\ndata: ${JSON.stringify({error: 'No prompt template found'})}\n\n`)
                return
            }
            if (!generatePreset) {
                reply.raw.write(`event: error\ndata: ${JSON.stringify({error: 'No generate preset found'})}\n\n`)
                return
            }

            // If set to continue an existing message, pop the last message
            if (request.body.continue) {
                existingChat.messages.pop()
            }

            // Format the messages and characters for the template
            const formattedMessages = existingChat?.messages.map((message) => {
                return {
                    text: message.content[message.activeIndex],
                    generated: message.generated,
                }
            })
            const formattedCharacters = existingChat?.characters.map(({character}) => {
                return {
                    name: character.name,
                    description: character.description,
                }
            })

            let prompt = ''
            try {
                const template = new Template(promptTemplate.content || '')
                prompt = template.render({
                    messages: formattedMessages,
                    characters: formattedCharacters,
                })
            } catch (err) {
                console.error('Failed to render template')
                console.error(err)
            }

            if (request.body.continue) {
                prompt += lastMessage.content[lastMessage.activeIndex]
            }

            console.log('prompt:', prompt)
            try {
                const response = await fetch('http://localhost:8080/completion', {
                    method: 'POST',
                    signal: controller.signal,
                    body: JSON.stringify({
                        stream: true,
                        cache_prompt: true,
                        prompt,
                        n_predict: generatePreset.maxTokens,
                        seed: generatePreset.seed,
                        temperature: generatePreset.temperature,
                        top_k: generatePreset.topK,
                        top_p: generatePreset.topP,
                        min_p: generatePreset.minP,
                        tfs_z: generatePreset.tfsz,
                        typical_p: generatePreset.typicalP,
                        repeat_penalty: generatePreset.repeatPenalty,
                        repeat_last_n: generatePreset.repeatLastN,
                        penalize_nl: generatePreset.penalizeNL,
                        presence_penalty: generatePreset.presencePenalty,
                        frequency_penalty: generatePreset.frequencyPenalty,
                        mirostat: generatePreset.mirostat,
                        mirostat_tau: generatePreset.mirostatTau,
                        mirostat_eta: generatePreset.mirostatEta,
                    }),
                })
                const responseIterable = responseToIterable(response)
                let bufferedResponse = ''
                for await (const chunk of responseIterable) {
                    const data = JSON.parse(chunk.data)
                    bufferedResponse += data.content
                    await db
                        .update(message)
                        .set({content: [bufferedResponse]})
                        .where(eq(message.id, lastMessage.id))
                    reply.raw.write(`event:text\ndata: ${JSON.stringify({text: data.content})}\n\n`)
                }

                // Send a final event with the full message text
                console.log('Buffered Response:', bufferedResponse)
                reply.raw.write(`event:final\ndata: ${JSON.stringify({text: bufferedResponse})}\n\n`)
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    console.log('Request aborted')
                } else {
                    console.error('Failed to generate response')
                    console.error(err)
                    reply.raw.write(`event: error\ndata: ${JSON.stringify({error: 'Failed to generate response'})}\n\n`)
                }
            } finally {
                request.socket.removeAllListeners('close')
                reply.raw.end()
                request.socket.destroy()
            }
        },
    })

    // console.log('Getting response character')
    // const characterNames = notUserCharacters.map(({character}) => `"${character.name}"`)
    // const gbnfNameString = characterNames.join(' | ')
    // const gram = getGrammar(`root ::= ( ${gbnfNameString} )`)
}
