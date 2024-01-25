const res = await fetch(`${apiBaseUrl}/completion`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        stream: false,
        prompt: currentMessage.value,
        max_tokens: 32,
        temperature: 0.9,
    }),
})

const watJson = await res.json()
console.log(watJson)
