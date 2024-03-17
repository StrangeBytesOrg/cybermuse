type Message = {
    userType: 'system' | 'user' | 'assistant'
    text: string
}

export const createPrompt = (messages: Message[]) => {
    let prompt = ''

    // Previous Messages (should include the current user message)
    messages.forEach((message) => {
        prompt += `<|im_start|>${message.userType}\n`
        prompt += `${message.text}<|im_end|>\n`
    })

    // Starting the assistant message
    // prompt += `<|im_start|>assistant\n`
    // prompt += `${character.value.name}:`
    return prompt
}
