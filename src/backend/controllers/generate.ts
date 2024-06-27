import {Elysia, t} from 'elysia'
import {Stream} from '@elysiajs/stream'
import {eq} from 'drizzle-orm'
// import {Template} from '@huggingface/jinja'
import {responseToIterable} from '../lib/sse.js'
import {db, user} from '../db.js'

const llamaCppBaseUrl = 'http://localhost:8080'

export const generateRoutes = new Elysia()

// TODO set response content type to text/event-stream
generateRoutes.post(
    '/generate-stream',
    async ({request, body}) => {
        return new Stream(async (stream) => {
            const controller = new AbortController()

            request.signal.onabort = () => {
                console.log('signal aborted')
                controller.abort()
            }

            const userSettings = await db.query.user.findFirst({
                where: eq(user.id, 1),
                with: {generatePreset: true},
            })
            const generatePreset = userSettings?.generatePreset
            if (!generatePreset) {
                stream.event = 'error'
                stream.send({error: 'No generate preset found'})
                return
            }

            try {
                const response = await fetch(`${llamaCppBaseUrl}/completion`, {
                    method: 'POST',
                    signal: controller.signal,
                    body: JSON.stringify({
                        stream: true,
                        cache_prompt: true,
                        prompt: body.prompt,
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
                    stream.event = 'text'
                    stream.send({text: data.content})
                }

                // Send the full response at the end as an extra check
                const finalResponse = `event: final\ndata: ${JSON.stringify({text: bufferedResponse})}\n\n`
                stream.event = 'final'
                stream.send({text: finalResponse})
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
        tags: ['generate'],
        detail: {
            operationId: 'GenerateStream',
            summary: 'Generate a completion stream',
            description: 'Generates text and stream the response using Server-Sent Events (SSE).',
        },
        body: t.Object({
            prompt: t.String(),
        }),
    },
)
