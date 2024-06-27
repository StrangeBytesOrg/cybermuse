/**
 * TextEncoderStream polyfill based on Node.js' implementation
 * https://github.com/nodejs/node/blob/3f3226c8e363a5f06c1e6a37abd59b6b8c1923f1/lib/internal/webstreams/encoding.js#L38-L119 (MIT License)
 */
export const TextDecoderStream = class {
    #handle: TextDecoder

    #transform = new TransformStream({
        transform: (chunk, controller) => {
            const value = this.#handle.decode(chunk, {stream: true})

            if (value) {
                controller.enqueue(value)
            }
        },
        flush: (controller) => {
            const value = this.#handle.decode()
            if (value) {
                controller.enqueue(value)
            }

            controller.terminate()
        },
    })

    constructor(encoding = 'utf-8', options: TextDecoderOptions = {}) {
        this.#handle = new TextDecoder(encoding, options)
    }

    get encoding() {
        return this.#handle.encoding
    }

    get fatal() {
        return this.#handle.fatal
    }

    get ignoreBOM() {
        return this.#handle.ignoreBOM
    }

    get readable() {
        return this.#transform.readable
    }

    get writable() {
        return this.#transform.writable
    }

    get [Symbol.toStringTag]() {
        return 'TextDecoderStream'
    }
}
