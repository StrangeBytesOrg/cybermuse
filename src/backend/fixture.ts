import {eq} from 'drizzle-orm'
import {db, User, Character, Chat, ChatCharacters, PromptTemplate, GeneratePreset} from './db.js'
import {logger} from './logging.js'

const defaultInstruction = `Roleplay in this chat with the user using the provided character description below.
{% for character in characters %}{{character.name}}: {{character.description}}
{% endfor %}
Use the following background information as lore.
{% for entry in lore %}
{{ entry.name }}: {{ entry.content }}
 {% endfor %}`

const chatMlInstruct = `{% for message in messages %}
<|im_start|>{{"user" if message.role == "user" else "assistant"}}
{{message.text}}<|im_end|>
{% endfor %}
<|im_start|>assistant
`

const chatMlChat = `<|im_start|>system
{{instruction}}<|im_end|>
{% for message in messages %}
<|im_start|>{{"user" if message.character.type == "user" else "assistant"}}
{{message.character.name}}: {{message.text}}<|im_end|>
{% endfor %}
<|im_start|>assistant
`

const llama3Instruct = `{% for message in messages %}<|start_header_id|>{{message.role}}<|end_header_id|>

{{message.text}}<|eot_id|>{% endfor %}<|start_header_id|>assistant<|end_header_id|>

`

const llama3Chat = `<|start_header_id|>system<|end_header_id|>

{{instruction}}<|eot_id|>{% for message in messages %}<|start_header_id|>{{message.role}}<|end_header_id|>

{{message.text | trim}}<|eot_id|>{% endfor %}<|start_header_id|>assistant<|end_header_id|>

`

const phi3Instruct = `{% for message in messages %}<|{{message.role}}|>{{message.text}}<|end|>
{% endfor %}<|assistant|>`

const phi3Chat = `<|user|>{{instruction}}<|end|>
{% for message in messages %}<|{{message.role}}|>{{message.character.name}}: {{message.text}}<|end|>
{% endfor %}<|assistant|>`

const gemmaInstruct = `{% for message in messages %}<start_of_turn>{{"user" if message.role == "user" else "model"}}
{{message.text}}<end_of_turn>
{% endfor %}
<start_of_turn>model
`

const gemmaChat = `<start_of_turn>user
{{instruction}}<end_of_turn>
{% for message in messages %}<start_of_turn>{{"user" if message.role == "user" else "model"}}
{{message.character.name}}: {{message.text}}<end_of_turn>
{% endfor %}
<start_of_turn>model
`

const commandRInstruct = `{% for message in messages %}<|START_OF_TURN_TOKEN|>{% if message.role == "system" %}<|SYSTEM_TOKEN|>{% elif message.role == "user" %}<|USER_TOKEN|>{% elif message.role == "assistant" %}<|CHATBOT_TOKEN|>{% endif %}|>{{message.text}}<|END_OF_TURN_TOKEN|>{% endfor %}`
const commandRChat = `<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>{{instruction}}<|END_OF_TURN_TOKEN|>{% for message in messages %}<|START_OF_TURN_TOKEN|>{% if message.role == "system" %}<|SYSTEM_TOKEN|>{% elif message.role == "user" %}<|USER_TOKEN|>{% elif message.role == "assistant" %}<|CHATBOT_TOKEN|>{% endif %}|>{{message.text}}<|END_OF_TURN_TOKEN|>{% endfor %}`

export const fixtureData = async () => {
    // Initialize a character for the user if it doesn't exist
    const existingUserCharacter = await db.query.Character.findFirst({where: eq(Character.id, 1)})
    if (!existingUserCharacter) {
        logger.info('Creating a default user character')
        await db.insert(Character).values({id: 1, name: 'User', description: 'The user.', type: 'user'})
    }

    const existingCharacter = await db.query.Character.findFirst({where: eq(Character.type, 'character')})
    if (!existingCharacter) {
        logger.info('Creating a default character')
        await db.insert(Character).values({
            name: 'Assistant',
            description: 'An AI assistant.',
            type: 'character',
            firstMessage: 'Hello!',
        })
        logger.info('Creating an initial chat')
        await db.insert(Chat).values({})
        await db.insert(ChatCharacters).values({chatId: 1, characterId: 1})
        await db.insert(ChatCharacters).values({chatId: 1, characterId: 2})
    }

    // Generation Preset
    const existingPreset = await db.query.GeneratePreset.findFirst({where: eq(GeneratePreset.id, 1)})
    if (!existingPreset) {
        logger.info('Creating default generate preset')
        await db.insert(GeneratePreset).values({
            id: 1,
            name: 'Default',
            context: 4096,
            maxTokens: 256,
            temperature: 1,
            seed: 69,
        })
    }

    // Create prompt templates
    const existingPromptPreset = await db.query.PromptTemplate.findFirst({where: eq(PromptTemplate.id, 1)})
    if (!existingPromptPreset) {
        logger.info('Creating default prompt templates')
        await db.insert(PromptTemplate).values({
            name: 'ChatML',
            instructTemplate: chatMlInstruct,
            chatTemplate: chatMlChat,
            chatInstruction: defaultInstruction,
        })
        await db.insert(PromptTemplate).values({
            name: 'Llama3',
            instructTemplate: llama3Instruct,
            chatTemplate: llama3Chat,
            chatInstruction: defaultInstruction,
        })
        await db.insert(PromptTemplate).values({
            name: 'Phi3',
            instructTemplate: phi3Instruct,
            chatTemplate: phi3Chat,
            chatInstruction: defaultInstruction,
        })
        await db.insert(PromptTemplate).values({
            name: 'Gemma',
            instructTemplate: gemmaInstruct,
            chatTemplate: gemmaChat,
            chatInstruction: defaultInstruction,
        })
        await db.insert(PromptTemplate).values({
            name: 'CommandR',
            instructTemplate: commandRInstruct,
            chatTemplate: commandRChat,
            chatInstruction: defaultInstruction,
        })
    }

    // Initialize a user
    const existingUser = await db.query.User.findFirst({where: eq(User.id, 1)})
    if (!existingUser) {
        logger.info('Creating a default user')
        await db.insert(User).values({id: 1, generatePreset: 1, promptTemplate: 1})
    }
}
