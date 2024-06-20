import {eq} from 'drizzle-orm'
import {db, user, character, chat, chatCharacters, promptTemplate, generatePresets} from './db.js'

const defaultSystemMessage = `Roleplay as the character specified.`

// Prompt Presets
const chatMl = `<|im_start|>system\n{{instruction}}<|im_end|>\n{% for message in messages %}\n<|im_start|>{{"user" if message.character.type == "user" else "assistant"}}\n{{message.character.name}}: {{message.text}}<|im_end|>\n{% endfor %}\n<|im_start|>assistant\n`
const llama3 = `<|start_header_id|>system<|end_header_id|>\n\n{{instruction}}<|eot_id|>{% for message in messages %}<|start_header_id|>{{message.role}}<|end_header_id|>\n\n{{message.text | trim}}<|eot_id|>{% endfor %}<|start_header_id|>assistant<|end_header_id|>\n\n`
const phi3 = `{% for message in messages %}<|{{message.role}}|>{{message.text}}<|end|>\n{% endfor %}<|assistant|>`
const phi3Roleplay = `<|user|>${defaultSystemMessage}{% for character in characters %}{{character.name}}: {{character.description}}\n{% endfor %}<|end|>\n{% for message in messages %}<|{{message.role}}|>\n{{message.character.name}}: {{message.text}}<|end|>\n{% endfor %}<|assistant|>\n{{char}}: `
const llama3Roleplay = `<|start_header_id|>system<|end_header_id|>\n\n${defaultSystemMessage}{% for character in characters %}{{character.name}}: {{character.description}}\n{% endfor %}<|eot_id|>{% for message in messages %}<|start_header_id|>{{message.role}}<|end_header_id|>\n\n{{message.text | trim}}<|eot_id|>{% endfor %}<|start_header_id|>assistant<|end_header_id|>\n\n{{char}}: `

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

    // Default chat
    const existingChat = await db.query.chat.findFirst({where: eq(character.id, 1)})
    if (!existingChat) {
        console.log('No chat found, creating one')
        await db.insert(chat).values({})
        await db.insert(chatCharacters).values({chatId: 1, characterId: 1})
        await db.insert(chatCharacters).values({chatId: 1, characterId: 2})
    }

    // Generation Preset
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

    // Create prompt templates
    const existingPromptPreset = await db.query.promptTemplate.findFirst({where: eq(promptTemplate.id, 1)})
    if (!existingPromptPreset) {
        await db.insert(promptTemplate).values({name: 'ChatML', content: chatMl})
        await db.insert(promptTemplate).values({name: 'Llama3', content: llama3})
        await db.insert(promptTemplate).values({name: 'Phi3', content: phi3})
        await db.insert(promptTemplate).values({name: 'Phi 3 Roleplay', content: phi3Roleplay})
        await db.insert(promptTemplate).values({name: 'Llama 3 Roleplay', content: llama3Roleplay})
    }

    // Initialize a user
    const existingUser = await db.query.user.findFirst({where: eq(user.id, 1)})
    if (!existingUser) {
        await db.insert(user).values({id: 1, generatePreset: 1, promptTemplate: 1})
    }
}
