import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox'
import type {FastifyPluginAsync} from 'fastify'
import {Type as t} from '@sinclair/typebox'
import {eq} from 'drizzle-orm'
// import {Template} from '@huggingface/jinja'
import {responseToIterable} from '../lib/sse.js'
import {db, user} from '../db.js'

const llamaCppBaseUrl = 'http://localhost:8080'

export const generateRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/generate-stream',
        method: 'POST',
        schema: {
            operationId: 'GenerateStream',
            tags: ['generate'],
            summary: 'Generate a completion stream',
            description: 'Generates text and stream the response using Server-Sent Events (SSE).',
            body: t.Object({
                prompt: t.String(),
            }),
            produces: ['text/event-stream'],
            response: {
                200: t.String({description: 'data: {text}'}),
            },
        },
        handler: async (request, reply) => {
            const controller = new AbortController()

            request.socket.on('close', () => {
                console.log('socket closed, aborting')
                controller.abort()
            })

            // Setup headers for server-sent events
            reply.raw.setHeader('Content-Type', 'text/event-stream')
            reply.raw.setHeader('Cache-Control', 'no-store')
            reply.raw.setHeader('Connection', 'keep-alive')
            reply.raw.setHeader('Access-Control-Allow-Origin', '*')

            const userSettings = await db.query.user.findFirst({
                where: eq(user.id, 1),
                with: {generatePreset: true},
            })
            const generatePreset = userSettings?.generatePreset
            if (!generatePreset) {
                reply.raw.write('event: error\ndata: {error: "No generate preset found"}\n\n')
                reply.raw.end()
                request.socket.destroy()
                return
            }

            try {
                const response = await fetch(`${llamaCppBaseUrl}/completion`, {
                    method: 'POST',
                    signal: controller.signal,
                    body: JSON.stringify({
                        stream: true,
                        cache_prompt: true,
                        prompt: request.body.prompt,
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
                    reply.raw.write(`event:text\ndata: ${JSON.stringify({text: data.content})}\n\n`)
                }

                // Send the full response at the end as an extra check
                const finalResponse = `event: final\ndata: ${JSON.stringify({text: bufferedResponse})}\n\n`
                reply.raw.write(finalResponse)
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    reply.raw.end('event: final\ndata: {text: "Aborted"}\n\n')
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
}
