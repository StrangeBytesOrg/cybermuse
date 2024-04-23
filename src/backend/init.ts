import {eq} from 'drizzle-orm'
import {db, character, generatePresets, promptSetting} from './db.js'

// Prompt Presets
const chatMlTemplate = `<|im_start|>system
{{instruction}}
The following are descriptions of each character in the dialogue.
{% for character in characters %}
Description of {{character.name}}: {{character.description}}
{% endfor %}<|im_end|>
{% for message in messages %}
<|im_start|>{{"user" if message.character.type == "user" else "assistant"}}
{{message.character.name}}: {{message.text}}<|im_end|>
{% endfor %}
<|im_start|>assistant\n`

const llama3Template = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

{{instruction}}
{% for character in characters %}
Description of {{character.name}}: {{character.description}}
{% endfor %}<|eot_id|>{% for message in messages %}<|start_header_id|>{{message.role}}<|end_header_id|>

{{message.text | trim}}<|eot_id|>{% endfor %}<|start_header_id|>assistant<|end_header_id|>\n\n`

export const initDb = async () => {
    // Initialize a character for the user if it doesn't exist
    const existingCharacter = await db.query.character.findFirst({where: eq(character.id, 1)})
    console.log(existingCharacter)
    if (!existingCharacter) {
        console.log('No character found, creating one')
        await db.insert(character).values({id: 1, name: 'User', description: 'The user.', type: 'user'})
    }

    // Create a default generate preset if it doesn't exist
    const existingPreset = await db.query.generatePresets.findFirst({where: eq(generatePresets.id, 1)})
    if (!existingPreset) {
        console.log('No generate preset found, creating one')
        await db.insert(generatePresets).values({
            id: 1,
            name: 'Default',
            maxTokens: 50,
            temperature: 0.5,
        })
    }

    // Create a default prompt setting if it doesn't exist
    const existingPromptPreset = await db.query.promptSetting.findFirst({where: eq(promptSetting.id, 1)})
    if (!existingPromptPreset) {
        await db.insert(promptSetting).values({
            name: 'ChatML',
            promptTemplate: chatMlTemplate,
            instruction:
                'Write a single response to the dialogue. Roleplay as the chosen character, and respond to the previous messages.',
            active: true,
        })
        await db.insert(promptSetting).values({
            name: 'Llama3',
            promptTemplate: llama3Template,
            instruction:
                'Write a single response to the dialogue. Roleplay as the chosen character, and respond to the previous messages.',
        })
    }
}
