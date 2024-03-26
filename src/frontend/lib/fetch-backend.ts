import {EventSourceParserStream} from 'eventsource-parser/stream'

const convertToAsyncIterable = async function* <T>(stream: ReadableStream<T>): AsyncGenerator<T> {
    const reader = stream.getReader()
    try {
        while (true) {
            const {done, value} = await reader.read()
            if (done) {
                break
            }
            yield value
        }
    } finally {
        reader.releaseLock()
    }
}

/**
 * Sends a Server-Sent Events (SSE) request to a specified URL and returns an async iterable of the event stream.
 * This implements non spec features around SSE such as sending a body and using POST requests.
 *
 * @param {string} url - The URL to send the SSE request to.
 * @param {string} body - The body of the request.
 * @param {AbortController} [controller=new AbortController()] - An optional AbortController to cancel the request.
 *
 * @returns {Promise<AsyncGenerator<any, void, unknown>>} - An async iterable of the event stream.
 *
 * @throws {Error} - Throws an error if the response does not contain a body.
 *
 * @example
 * const url = 'https://example.com/sse-endpoint';
 * const body = JSON.stringify({ event: 'start' });
 * const iterable = await sseRequest(url, body);
 * for await (const event of iterable) {
 *   console.log(event);
 * }
 */
export const sseRequest = async (url: string, body: string, controller: AbortController = new AbortController()) => {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body,
        signal: controller.signal,
    })

    if (!res.body) {
        throw new Error('No body')
    }

    const eventStream = res.body.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream())
    const iterable = await convertToAsyncIterable(eventStream)
    return iterable
}

export type GenerationParams = {
    prompt: string
    n_predict: number
    temperature: number
    top_p: number
    top_k: number
    stop: string[]
    seed: number
    stream: boolean
}

export const request = async (apiBase: string, generationParams: GenerationParams) => {
    const url = `${apiBase}/api/generate-stream`
    const body = JSON.stringify(generationParams)
    return await sseRequest(url, body)
}
