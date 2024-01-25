const paramDefaults = {
    stream: true,
    n_predict: 500,
    temperature: 0.2,
    stop: ['</s>'],
}

// Completes the prompt as a generator. Recommended for most use cases.
//
// Example:
//
//    import { llama } from '/completion.js'
//
//    const request = llama("Tell me a joke", {n_predict: 800})
//    for await (const chunk of request) {
//      document.write(chunk.data.content)
//    }
//
export async function* llama(prompt = '', params = {}, config = {}, url = '/completion') {
    let generation_settings = null
    let controller = config.controller

    if (!controller) {
        controller = new AbortController()
    }

    const completionParams = {...paramDefaults, ...params, prompt}

    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(completionParams),
        headers: {
            Connection: 'keep-alive',
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
        },
        signal: controller.signal,
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    let content = ''
    let leftover = '' // Buffer for partially read lines

    try {
        let cont = true

        while (cont) {
            const result = await reader.read()
            if (result.done) {
                break
            }

            // Add any leftover data to the current chunk of data
            const text = leftover + decoder.decode(result.value)

            // Check if the last character is a line break
            const endsWithLineBreak = text.endsWith('\n')

            // Split the text into lines
            const lines = text.split('\n')

            // If the text doesn't end with a line break, then the last line is incomplete
            // Store it in leftover to be added to the next chunk of data
            if (!endsWithLineBreak) {
                leftover = lines.pop()
            } else {
                leftover = '' // Reset leftover if we have a line break at the end
            }

            // Parse all sse events and add them to result
            const regex = /^(\S+):\s(.*)$/gm
            for (const line of lines) {
                const match = regex.exec(line)
                if (match) {
                    result[match[1]] = match[2]
                    // since we know this is llama.cpp, let's just decode the json in data
                    if (result.data) {
                        result.data = JSON.parse(result.data)
                        content += result.data.content

                        // yield
                        yield result

                        // if we got a stop token from server, we will break here
                        if (result.data.stop) {
                            if (result.data.generation_settings) {
                                generation_settings = result.data.generation_settings
                            }
                            cont = false
                            break
                        }
                    }
                }
            }
        }
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error('llama error: ', e)
        }
        throw e
    } finally {
        controller.abort()
    }

    return content
}

/*
MIT License

Copyright (c) 2023 Georgi Gerganov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
