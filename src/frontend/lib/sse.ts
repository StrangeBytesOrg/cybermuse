import {EventSourceParserStream, type EventSourceMessage} from 'eventsource-parser/stream'

export const convertToAsyncIterable = async function*<T>(stream: ReadableStream<T>): AsyncGenerator<T> {
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
 * Converts a fetch response to an async iterable of a Server Sent Events (SSE) stream.
 *
 * @param {Response} response - An HTTP response object.
 * @returns {AsyncGenerator<ParsedEvent>} - An async iterable of a Server Sent Events (SSE) stream.
 * @throws {Error} - Throws an error if the response does not contain a body.
 */
export const responseToIterable = (response: Response): AsyncGenerator<EventSourceMessage> => {
    if (!response.body) {
        throw new Error('No body')
    }
    const eventStream = response.body.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream())
    return convertToAsyncIterable(eventStream)
}
