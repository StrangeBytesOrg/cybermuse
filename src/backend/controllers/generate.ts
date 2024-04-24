import type {ZodTypeProvider} from 'fastify-type-provider-zod'
import type {FastifyPluginAsync} from 'fastify'
import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {Template} from '@huggingface/jinja'
import {db, user} from '../db.js'
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
                instruction: z.string().optional(),
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

            const userSettings = await db.query.user.findFirst({
                where: eq(user.id, 1),
                with: {promptSetting: true, generatePreset: true},
                columns: {promptSetting: true, generatePreset: true},
            })
            const generationSettings = userSettings?.generatePreset

            try {
                const promptTemplate = new Template(userSettings?.promptSetting?.promptTemplate || '')
                const prompt = promptTemplate.render({
                    instruction: req.body.instruction || '',
                    messages: [{text: req.body.prompt, role: 'user'}],
                })
                console.log(prompt)

                const fullResponse = await generate(prompt, {
                    maxTokens: generationSettings?.maxTokens,
                    temperature: generationSettings?.temperature,
                    minP: generationSettings?.minP || undefined,
                    topP: generationSettings?.topP || undefined,
                    topK: generationSettings?.topK || undefined,
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
                if (err instanceof DOMException && err.name === 'AbortError') {
                    reply.raw.end('event: final\ndata: {text: "Aborted"}\n\n')
                } else {
                    console.log('Unknown error:', err)
                    reply.raw.end('event: final\ndata: {text: "Error"}\n\n')
                }
            }
        },
    })
}
