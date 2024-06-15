import {eq} from 'drizzle-orm'
import {db, user, character, promptTemplate, generatePresets} from './db.js'

// Prompt Presets
const chatMlTemplate = `<|im_start|>system
{{instruction}}<|im_end|>
{% for message in messages %}
<|im_start|>{{"user" if message.character.type == "user" else "assistant"}}
{{message.character.name}}: {{message.text}}<|im_end|>
{% endfor %}
<|im_start|>assistant\n`

const llama3Template = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

{{instruction}}<|eot_id|>{% for message in messages %}<|start_header_id|>{{message.role}}<|end_header_id|>

{{message.text | trim}}<|eot_id|>{% endfor %}<|start_header_id|>assistant<|end_header_id|>

`

const phi3Template = `{{ bos_token }}{% for message in messages %}{{'<|' + message['role'] + '|>' + ' ' + message['text'] + '<|end|> ' }}{% endfor %}{{ '<|assistant|> ' }}`

// const defaultInstruction = `Write a single response to the dialogue. Roleplay as the chosen character, and respond to the previous messages.
// {% for character in characters %}
// Description of {{character.name}}: {{character.description}}
// {% endfor %}`

export const fixtureData = async () => {
    // Initialize a character for the user if it doesn't exist
    const existingUserCharacter = await db.query.character.findFirst({where: eq(character.id, 1)})
    if (!existingUserCharacter) {
        console.log('No character found, creating one')
        await db.insert(character).values({id: 1, name: 'User', description: 'The user.', type: 'user'})
    }

    const existingCharacter = await db.query.character.findFirst({where: eq(character.id, 2)})
    if (!existingCharacter) {
        await db.insert(character).values({
            name: 'Assistant',
            description: 'An AI assistant.',
            type: 'character',
            firstMessage: 'Hello!',
        })
    }

    // Create a default generate preset if it doesn't exist
    const existingPreset = await db.query.generatePresets.findFirst({where: eq(generatePresets.id, 1)})
    if (!existingPreset) {
        console.log('No generate preset found, creating one')
        await db.insert(generatePresets).values({
            id: 1,
            name: 'Default',
            context: 256,
            maxTokens: 50,
            temperature: 0.5,
            seed: 69,
        })
    }

    // Create default prompt presets
    const existingPromptPreset = await db.query.promptTemplate.findFirst({where: eq(promptTemplate.id, 1)})
    if (!existingPromptPreset) {
        await db.insert(promptTemplate).values({
            name: 'ChatML',
            content: chatMlTemplate,
        })
        await db.insert(promptTemplate).values({
            name: 'Llama3',
            content: llama3Template,
        })
        await db.insert(promptTemplate).values({
            name: 'Phi3',
            content: phi3Template,
        })
    }

    // Initialize a user
    const existingUser = await db.query.user.findFirst({where: eq(user.id, 1)})
    if (!existingUser) {
        await db.insert(user).values({id: 1, generatePreset: 1, promptTemplate: 1})
    }
}
