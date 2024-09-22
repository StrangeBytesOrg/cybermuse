import {Template} from '@huggingface/jinja'

type ChatTemplates = Record<string, {template: string; example: string}>
export const chatTemplates: ChatTemplates = {
    chatml: {
        template: `{% for message in messages %}<|im_start|>{{ message.role }}\n{{message.content}}<|im_end|>\n{% endfor %}{% if add_response %}<|im_start|>assistant\n{% endif %}`,
        example: '<|im_start|>system',
    },
    llama3: {
        template: `{% for message in messages %}<|start_header_id|>{{ message.role }}<|end_header_id|>\n\n{{ message.content }}<|eot_id|>{% endfor %}{% if add_response %}<|start_header_id|>assistant<|end_header_id|>\n\n{% endif %}`,
        example: '<|start_header_id|>system<|end_header_id|>',
    },
    gemma: {
        template: `{% for message in messages %}{% if message.role == "system" %}{% set message.role = "user" %}{% endif %}<start_of_turn>{{ message.role }}\n{{ message.content }}<end_of_turn>\n{% endfor %}{% if add_response %}<start_of_turn>model\n{% endif %}`,
        example: '<start_of_turn>user',
    },
    phi3: {
        template: `{% for message in messages %}<|{{message.role}}|>\n{{message.content}}<|end|>\n{% endfor %}{% if add_response %}<|assistant|>\n{% endif %}`,
        example: '<|system|>',
    },
    commandR: {
        template: `{% for message in messages %}<|START_OF_TURN_TOKEN|><|{{ message.role.toUpperCase() }}_TOKEN|>{{ message.content }}<|END_OF_TURN_TOKEN|><|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>\n{% endfor %}{% if add_response %}<BOS_TOKEN><|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>{{ response }}<|END_OF_TURN_TOKEN|><|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>\n{% endif %}`,
        example:
            '<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>You are a helpful assistant<|END_OF_TURN_TOKEN|><|START_OF_TURN_TOKEN|><|USER_TOKEN|>Hello<|END_OF_TURN_TOKEN|><|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>Hi there<|END_OF_TURN_TOKEN|><|START_OF_TURN_TOKEN|><|USER_TOKEN|>How are you?<|END_OF_TURN_TOKEN|><|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>',
    },
    mistral: {
        // Not completely correct since Mistral puts the system prompt as part of the last user message.
        // Whitespace needs to be figured out. Mistral Small and Large include whitespace around prompt, but Nemo does not, probably because of something to do with tokenization: https://huggingface.co/mistralai/Mistral-Nemo-Instruct-2407/discussions/56
        template: `{% for message in messages %}{% if message.role == "user" or message.role == "system" %}[INST]{{ message.content }}[/INST]{% elif message.role == "assistant" %} {{ message.content }}</s>{% endif %}{% endfor %}`,
        example: '[INST] You are a helpful assistant',
    },
    llama2: {
        template: `{% for message in messages %}{% if message.role == "system" %}[INST] <<SYS>>\n{{ message.content }}\n<</SYS>>\n{% elif message.role == "user" %}{{ message.content }} [/INST]{% endif %}{% endfor %}{% if add_response %}<s>[INST] {{ response }} [/INST]{% endif %}`,
        example: '[INST] <<SYS>>',
    },
    // Maybe add Vicuna, Alpaca, and Zephyr
}

type TemplateName = keyof typeof chatTemplates
export type Messages = {role: 'system' | 'user' | 'assistant'; content: string}[]
export const formatPrompt = (templateName: TemplateName, messages: Messages) => {
    const template = new Template(chatTemplates[templateName].template)
    const prompt = template.render({
        messages,
        add_response: true,
    })
    return prompt
}
