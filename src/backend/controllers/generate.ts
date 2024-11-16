import {z} from 'zod'
import {t} from '../trpc.js'
import {logger} from '../logging.js'
import {llamaChat, llama, formatMessage} from '../llama-cpp.js'
import {LlamaGrammar} from 'node-llama-cpp'

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
                    repeatPenalty: z.object({
                        penalty: z.number().optional(),
                        frequencyPenalty: z.number().optional(),
                        presencePenalty: z.number().optional(),
                        penalizeNewLine: z.boolean().optional(),
                        lastTokens: z.number().optional(),
                    }),
                }),
                gbnfString: z.string().optional(),
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

            let grammar: LlamaGrammar
            if (input.gbnfString) {
                grammar = await llama.createGrammar({
                    grammar: input.gbnfString,
                })
            }

            const chunkStream = new ReadableStream({
                async start(controller) {
                    await llamaChat.generateResponse(chatHistory, {
                        ...generationSettings,
                        grammar,
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
    generateNonStreaming: t.procedure
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
                    repeatPenalty: z.object({
                        penalty: z.number().optional(),
                        frequencyPenalty: z.number().optional(),
                        presencePenalty: z.number().optional(),
                        penalizeNewLine: z.boolean().optional(),
                        lastTokens: z.number().optional(),
                    }),
                }),
                gbnfString: z.string().optional(),
            }),
        )
        .mutation(async ({input}) => {
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

            const grammar = input.gbnfString ? await llama.createGrammar({grammar: input.gbnfString}) : undefined

            const res = await llamaChat.generateResponse(chatHistory, {
                ...generationSettings,
                grammar,
            })
            return res
        }),
})
