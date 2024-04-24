import type {ZodTypeProvider} from 'fastify-type-provider-zod'
import type {FastifyPluginAsync} from 'fastify'
import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {Template} from '@huggingface/jinja'
import {db, chat, message, generatePresets, promptSetting} from '../db.js'
import {generate, detokenize, getGrammar} from '../generate.js'

export const messageRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/new-message',
        method: 'POST',
        schema: {
            summary: 'Add a message to the chat',
            body: z.object({
                chatId: z.number(),
                characterId: z.number(),
                text: z.string(),
            }),
            response: {
                200: z.object({
                    success: z.boolean(),
                    id: z.number().optional(),
                }),
            },
        },
        handler: async (request) => {
            const {chatId, characterId, text} = request.body
            try {
                const [newMessage] = await db
                    .insert(message)
                    .values({chatId, text, characterId})
                    .returning({id: message.id})
                return {success: true, id: newMessage.id}
            } catch (err) {
                // TODO proper error handling
                console.error(err)
                throw new Error('Failed to create message')
            }
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/generate-message',
        method: 'POST',
        schema: {
            summary: 'Generate a new response message',
            body: z.object({
                chatId: z.number(),
            }),
            produces: ['text/event-stream'],
            response: {
                200: z.string().describe('data: {text}'),
            },
        },
        handler: async (request, reply) => {
            const {chatId} = request.body

            // Setup headers for server-sent events
            reply.raw.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-store',
                'Connection': 'keep-alive',
                'access-control-allow-origin': '*',
            })

            const existingChat = await db.query.chat.findFirst({
                where: eq(chat.id, chatId),
                with: {chatCharacters: {with: {character: true}}},
            })
            const notUserCharacters = existingChat?.chatCharacters.filter(
                (chatCharacter) => chatCharacter.characterId !== existingChat.userCharacter,
            )

            const previousMessages = await db.query.message.findMany({
                where: eq(message.chatId, chatId),
                with: {character: true},
            })
            // console.log(previousMessages)
            previousMessages.forEach((message) => {
                if (message.character?.type === 'user') {
                    message.role = 'user'
                } else if (message.character?.type === 'character') {
                    message.role = 'assistant'
                }
            })

            const promptSettings = await db.query.promptSetting.findFirst({where: eq(promptSetting.active, true)})
            const generationSettings = await db.query.generatePresets.findFirst({where: eq(generatePresets.id, 1)})

            let prompt = ''
            try {
                // Parse character descriptions
                const parsedCharacters = notUserCharacters.map(({character}) => {
                    const characterTemplate = new Template(character.description)
                    const description = characterTemplate.render({char: character.name})
                    return {name: character.name, description}
                })

                const instructionTemplate = new Template(promptSettings?.instruction || '')
                const template = new Template(promptSettings?.promptTemplate || '')
                const instruction = instructionTemplate.render({
                    characters: parsedCharacters,
                })
                console.log('i:', instruction)
                prompt = template.render({
                    messages: previousMessages,
                    instruction,
                    characters: parsedCharacters,
                })
                console.log('template:', promptSettings?.promptTemplate)
            } catch (err) {
                console.error('Failed to render template')
                console.error(err)
            }

            console.log('prompt:', prompt)

            console.log('Getting response character')
            const characterNames = notUserCharacters.map(({character}) => `"${character.name}"`)
            const gbnfNameString = characterNames.join(' | ')
            const gram = getGrammar(`root ::= ( ${gbnfNameString} )`)

            const pickedCharacter = await generate(prompt, {
                grammar: gram,
                // onToken: (token) => {
                //     // TODO strip special tokens, especially end token
                // },
            })

            console.log('Decider Response:', pickedCharacter)
            const chosenCharacter = notUserCharacters.find(({character}) => character.name === pickedCharacter)
            console.log('Chosen Character:', chosenCharacter)

            // Create a new message in the database which will be updated with the response
            const [newMessage] = await db
                .insert(message)
                .values({text: '', chatId, characterId: chosenCharacter?.characterId})
                .returning({id: message.id, characterId: message.characterId})

            // Send an initial response with a message ID and characterId
            let initialResponse = `event: initial\n`
            initialResponse += `data: ${JSON.stringify({id: newMessage.id, characterId: newMessage.characterId})}\n\n`
            reply.raw.write(initialResponse)

            prompt += `${chosenCharacter?.character.name}: `
            let bufferedResponse = ''
            const fullResponse = await generate(prompt, {
                maxTokens: generationSettings.maxTokens,
                temperature: generationSettings.temperature,
                minP: generationSettings.minP ?? undefined,
                topP: generationSettings.topP ?? undefined,
                topK: generationSettings.topK ?? undefined,
                // stopGenerationTriggers
                onToken: async (token) => {
                    const text = detokenize(token)
                    console.log(`Token: ${token}, text: ${text}`)
                    if (text === '<|im_end|>') {
                        console.log('Got end token')
                        return
                    }
                    bufferedResponse += text
                    await db.update(message).set({text: bufferedResponse}).where(eq(message.id, newMessage.id))
                    reply.raw.write(`event: message\ndata: ${JSON.stringify({text})}\n\n`)
                },
            })

            // TODO check if final response matches buffered response

            let finalResponse = `event: final\n`
            finalResponse += `data: ${JSON.stringify({text: fullResponse})}\n\n`
            reply.raw.end(finalResponse)
            request.socket.destroy()
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/update-message',
        method: 'POST',
        schema: {
            summary: 'Update an existing message',
            body: z.object({
                id: z.number(),
                text: z.string(),
            }),
            response: {
                200: z.object({success: z.boolean()}),
            },
        },
        handler: async (req) => {
            const {id, text} = req.body
            await db.update(message).set({text}).where(eq(message.id, id))
            return {success: true}
        },
    })

    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/delete-message',
        method: 'POST',
        schema: {
            summary: 'Delete a Message',
            body: z.object({
                id: z.number(),
            }),
            response: {
                200: z.object({success: z.boolean()}),
            },
        },
        handler: async (req) => {
            await db.delete(message).where(eq(message.id, req.body.id))
            return {success: true}
        },
    })
}
