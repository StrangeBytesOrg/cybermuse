export const defaultInstruction = `Roleplay in this chat with the user using the provided character description below.
{% for character in characters %}{{character.name}}: {{character.description}}
{% endfor %}`

export const chatMl = `<|im_start|>system
{{instruction}}<|im_end|>
{% for message in messages %}
<|im_start|>{{"user" if message.character.type == "user" else "assistant"}}
{{message.character.name}}: {{message.text}}<|im_end|>
{% endfor %}
<|im_start|>assistant
`

export const llama3 = `<|start_header_id|>system<|end_header_id|>

{{instruction}}<|eot_id|>{% for message in messages %}<|start_header_id|>{{message.role}}<|end_header_id|>

{{message.text | trim}}<|eot_id|>{% endfor %}<|start_header_id|>assistant<|end_header_id|>

`

export const phi3 = `{% for message in messages %}<|{{message.role}}|>{{message.text}}<|end|>
{% endfor %}<|assistant|>`
