export const chatMLRoleplay = `<|im_start|>system
Roleplay in this chat with the user using the provided character description below.

{% for character in characters %}{{character.name}}: {{character.description}}
{% endfor %}<|im_end|>
{% for message in messages %}
<|im_start|>{{"user" if message.character.type == "user" else "assistant"}}
{{message.character.name}}: {{message.text}}<|im_end|>
{% endfor %}
<|im_start|>assistant
{{char}}: `

export const llama3Roleplay = `<|start_header_id|>system<|end_header_id|>

Roleplay in this chat with the user using the provided character description below.
{% for character in characters %}{{character.name}}: {{character.description}}
{% endfor %}<|eot_id|>{% for message in messages %}<|start_header_id|>{{message.role}}<|end_header_id|>

{{message.character.name}}: {{message.text | trim}}<|eot_id|>{% endfor %}<|start_header_id|>assistant<|end_header_id|>

{{char}}: `

export const phi3Roleplay = `<|user|>Roleplay in this chat with the user using the provided character description below.
{% for character in characters %}{{character.name}}: {{character.description}}
{% endfor %}<|end|>
{% for message in messages %}<|{{message.role}}|>
{{message.character.name}}: {{message.text}}<|end|>
{% endfor %}<|assistant|>
{{char}}: `

export const chatMl = `{% for message in messages %}
<|im_start|>{{"user" if message.character.type == "user" else "assistant"}}
{{message.character.name}}: {{message.text}}<|im_end|>
{% endfor %}
<|im_start|>assistant
`

export const llama3 = `{% for message in messages %}<|start_header_id|>{{message.role}}<|end_header_id|>

{{message.text | trim}}<|eot_id|>{% endfor %}<|start_header_id|>assistant<|end_header_id|>

`

export const phi3 = `{% for message in messages %}<|{{message.role}}|>{{message.text}}<|end|>
{% endfor %}<|assistant|>`
