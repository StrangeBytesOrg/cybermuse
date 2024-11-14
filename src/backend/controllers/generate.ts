import {z} from 'zod'
import {t} from '../trpc.js'
import {logger} from '../logging.js'
import {llamaChat, formatMessage} from '../llama-cpp.js'

export const generateRouter = t.router({
    generate: t.procedure
        .input(
            z.object({
                systemPrompt: z.string(),
                messages: z.array(
                    z.object({
                        type: z.union([z.literal('user'), z.literal('model'), z.literal('system')]),
                        content: z.string(),
                    }),
                ),
                generationSettings: z.object({
                    maxTokens: z.number(),
                    temperature: z.number(),
                    seed: z.number().optional(),
                    topK: z.number().optional(),
                    topP: z.number().optional(),
                    minP: z.number().optional(),
                    // TODO add all the other generation settings
                    // repeatPenalty: {
                    //     penalty: generatePreset.repeatPenalty || undefined,
                    //     presencePenalty: generatePreset.presencePenalty || undefined,
                    //     frequencyPenalty: generatePreset.frequencyPenalty || undefined,
                    //     penalizeNewLine: generatePreset.penalizeNL || undefined,
                    //     lastTokens: generatePreset.repeatLastN || undefined,
                    // },
                }),
            }),
        )
        .mutation(async function* ({input, signal}) {
            const {systemPrompt, messages, generationSettings} = input
            logger.debug('generationSettings', generationSettings)
            const chatHistory = llamaChat.chatWrapper.generateInitialChatHistory({systemPrompt})
            messages.forEach((message) => {
                const formattedMessage = formatMessage(message)
                chatHistory.push(formattedMessage)
            })

            const contextState = llamaChat.chatWrapper.generateContextState({chatHistory})
            const tokens = contextState.contextText.tokenize(llamaChat.model.tokenizer)
            logger.debug('prompt', contextState.contextText.toString())
            logger.debug('tokens', tokens.length)

            // TODO add optional grammar
            // const grammar = await llama.createGrammar({
            //     grammar: 'root ::= ' + characters.map((c) => `"${c.name}"`).join(' | '),
            // })
            // logger.debug('grammar string', grammar.grammar)

            const chunkStream = new ReadableStream({
                async start(controller) {
                    await llamaChat.generateResponse(chatHistory, {
                        ...generationSettings,
                        stopOnAbortSignal: true,
                        signal,
                        onTextChunk: (chunk) => controller.enqueue(chunk),
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
                yield bufferedResponse
            }
            logger.info('response', bufferedResponse)
        }),
})
