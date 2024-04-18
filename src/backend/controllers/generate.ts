import type {ZodTypeProvider} from 'fastify-type-provider-zod'
import type {FastifyPluginAsync} from 'fastify'
import {z} from 'zod'
import {generate, detokenize} from '../generate.js'

export const generateRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        url: '/generate-stream',
        method: 'POST',
        schema: {
            summary: 'Generate a completion stream',
            description:
                'Generates text and returns it using Server-Sent Events (SSE) to stream the response.\n```\nevent: message | final\ndata: {text}\n```\n\nThe `message` event is sent for each token generated and the `final` event is sent at the end with the full response.\n\nThis is a non standard SSE implementation in order to support sending a body and using POST requests so it will not work with the browser EventSource API.',
            body: z.object({
                prompt: z.string(),
                maxTokens: z.number().optional(),
                temperature: z.number().optional(),
                minP: z.number().optional(),
                topP: z.number().optional(),
                topK: z.number().optional(),
                // repeatPenalty: // TODO More complex than simple number input. Needs further investigation.
                // stop: z.array(z.string()).optional(),
                // seed: z.number().optional(),
            }),
            produces: ['text/event-stream'],
            response: {
                200: z.string().describe('data: {text}'),
            },
        },
        handler: async (req, reply) => {
            const controller = new AbortController()

            req.socket.on('close', () => {
                console.log('socket closed, aborting')
                controller.abort()
            })

            reply.raw.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-store',
                'Connection': 'keep-alive',
                'access-control-allow-origin': '*',
            })

            const prompt = req.body.prompt

            try {
                const fullResponse = await generate(prompt, {
                    maxTokens: req.body.maxTokens,
                    temperature: req.body.temperature,
                    minP: req.body.minP,
                    topP: req.body.topP,
                    topK: req.body.topK,
                    signal: controller.signal,
                    // repeatPenalty: req.body.repeatPenalty,
                    onToken: (token) => {
                        const text = detokenize(token)
                        reply.raw.write(`event: message\ndata: ${JSON.stringify({text})}\n\n`)
                    },
                })

                // Send the full response at the end as an extra check
                const finalResponse = `event: final\ndata: ${JSON.stringify({text: fullResponse})}\n\n`
                reply.raw.end(finalResponse)
                req.socket.removeAllListeners('close')
                req.socket.destroy()
            } catch (err) {
                switch (err.name) {
                    case 'AbortError':
                        reply.raw.end('event: final\ndata: {text: "Aborted"}\n\n')
                        break
                    default:
                        console.log('Unknown error:', err)
                        reply.raw.end('event: final\ndata: {text: "Error"}\n\n')
                        break
                }
            }
        },
    })
}
