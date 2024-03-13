type Message = {
    userType: 'user' | 'assistant'
    user: string
    text: string
}

export const createPrompt = (systemPrompt: string, messages: Message[]) => {
    let prompt = ''

    // System Message
    prompt += `<|im_start|>system\n`
    prompt += systemPrompt
    prompt += `<|im_end|>\n`

    // Previous Messages (should include the current user message)
    messages.forEach((message) => {
        prompt += `<|im_start|>${message.userType}\n`
        prompt += `${message.user}: ${message.text}\n`
        prompt += `<|im_end|>\n`
    })

    // Starting the assistant message
    prompt += `<|im_start|>assistant\n`
    // prompt += `${character.value.name}:`
    return prompt
}
