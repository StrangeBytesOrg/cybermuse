import {Elysia, t} from 'elysia'
import {Stream} from '@elysiajs/stream'
import {eq} from 'drizzle-orm'
import {Template} from '@huggingface/jinja'
import {db, message, chat, user} from '../db.js'
import {responseToIterable} from '../lib/sse.js'

const llamaCppBaseUrl = 'http://localhost:8080'

// TODO get response character route
// const characterNames = notUserCharacters.map(({character}) => `"${character.name}"`)
// const gbnfNameString = characterNames.join(' | ')
// const gram = getGrammar(`root ::= ( ${gbnfNameString} )`)

export const messageRoutes = new Elysia()

messageRoutes.post(
    '/create-message',
    async ({body}) => {
        const {chatId, characterId, generated, text} = body
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
    {
        tags: ['messages'],
        detail: {
            operationId: 'CreateMessage',
            summary: 'Add a message to the chat',
        },
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
)

messageRoutes.post(
    '/update-message/:id',
    async ({params, body}) => {
        const dbMessage = await db.query.message.findFirst({
            where: eq(message.id, Number(params.id)),
        })
        if (!dbMessage) {
            throw new Error('Message not found')
        }
        const content = dbMessage.content
        content[dbMessage.activeIndex] = body.text
        await db
            .update(message)
            .set({content})
            .where(eq(message.id, Number(params.id)))
    },
    {
        tags: ['messages'],
        detail: {
            operationId: 'UpdateMessage',
            summary: 'Update an existing message',
        },
        params: t.Object({id: t.String()}),
        body: t.Object({
            text: t.String(),
        }),
    },
)

messageRoutes.post(
    '/delete-message/:id',
    async ({params}) => {
        await db.delete(message).where(eq(message.id, Number(params.id)))
    },
    {
        tags: ['messages'],
        detail: {
            operationId: 'DeleteMessage',
            summary: 'Delete a Message',
        },
        params: t.Object({id: t.String()}),
    },
)

messageRoutes.post(
    '/generate-message',
    async ({request, body}) => {
        const {chatId} = body
        return new Stream(async (stream) => {
            const controller = new AbortController()
            request.signal.onabort = () => {
                console.log('User aborted or disconnected')
                controller.abort()
            }

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
                stream.event = 'error'
                stream.send({error: 'No messages found'})
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
                stream.event = 'error'
                stream.send({error: 'No user settings found'})
                return
            }
            const promptTemplate = userSettings.promptTemplate
            const generatePreset = userSettings.generatePreset
            if (!promptTemplate) {
                stream.event = 'error'
                stream.send({error: 'No prompt template found'})
                return
            }
            if (!generatePreset) {
                stream.event = 'error'
                stream.send({error: 'No generate preset found'})
                return
            }

            // If set to continue an existing message, pop the last message
            if (body.continue) {
                existingChat.messages.pop()
            }

            // Format the messages and characters for the template
            const formattedMessages = existingChat?.messages.map((message) => {
                const messageCharacter = existingChat.characters.find(
                    ({character}) => character.id === message.characterId,
                )
                return {
                    text: message.content[message.activeIndex],
                    generated: message.generated,
                    role: message.generated ? 'assistant' : 'user',
                    character: messageCharacter?.character,
                }
            })
            const formattedCharacters = existingChat?.characters.map(({character}) => {
                return character
            })
            console.log(formattedMessages)
            console.log(formattedCharacters)

            const tokenLimit = generatePreset.context
            let prompt = ''
            let tokenCount = 0
            try {
                for (let i = formattedMessages.length - 1; i >= 0; i -= 1) {
                    const messagesSubset = formattedMessages.slice(i, formattedMessages.length - 1)
                    const template = new Template(promptTemplate.content || '')
                    const newPrompt = template.render({
                        messages: messagesSubset,
                        characters: formattedCharacters,
                        char: pickedCharacter?.character.name,
                    })
                    tokenCount = await getTokenCount(prompt)
                    if (tokenCount < tokenLimit) {
                        prompt = newPrompt
                    } else {
                        console.log(`Token limit reached: ${tokenCount}`)
                        break
                    }
                }
            } catch (err) {
                console.error('Failed to render template')
                console.error(err)
                stream.event = 'error'
                stream.send({error: 'Failed creating prompt'})
                return
            }

            if (body.continue) {
                prompt += lastMessage.content[lastMessage.activeIndex]
            }

            console.log('prompt:', prompt)
            console.log('token count:', tokenCount)

            try {
                const response = await fetch(`${llamaCppBaseUrl}/completion`, {
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
                if (body.continue) {
                    bufferedResponse = lastMessage.content[lastMessage.activeIndex]
                }
                for await (const chunk of responseIterable) {
                    const data = JSON.parse(chunk.data)
                    bufferedResponse += data.content
                    await db
                        .update(message)
                        .set({content: [bufferedResponse]})
                        .where(eq(message.id, lastMessage.id))
                    stream.event = 'text'
                    stream.send({text: data.content})
                }

                // Send a final event with the full message text
                console.log('Buffered Response:', bufferedResponse)
                stream.event = 'final'
                stream.send({text: bufferedResponse})
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    console.log('Request aborted')
                } else {
                    console.error('Failed to generate response')
                    console.error(err)
                    stream.event = 'error'
                    stream.send({error: 'Failed to generate response'})
                }
            } finally {
                stream.close()
            }
        })
    },
    {
        tags: ['messages'],
        detail: {
            operationId: 'GenerateMessage',
            summary: 'Generate a message for the chat',
        },
        body: t.Object({
            chatId: t.Number(),
            continue: t.Boolean(),
        }),
    },
)

const getTokenCount = async (prompt: string) => {
    const response = await fetch(`${llamaCppBaseUrl}/tokenize`, {
        method: 'POST',
        body: JSON.stringify({
            content: prompt,
        }),
    })
    const {tokens} = (await response.json()) as {tokens: string[]}
    if (!tokens || !Array.isArray(tokens)) {
        throw new Error('Invalid response from tokenization')
    }
    return tokens.length
}
