import {eq} from 'drizzle-orm'
import {db, User, Character, Chat, ChatCharacters, PromptTemplate, GeneratePreset} from './db.js'
import {logger} from './logging.js'

const defaultSystemMessage = `Roleplay as the character specified.`

// Prompt Presets
const chatMl = `<|im_start|>system\n{{instruction}}<|im_end|>\n{% for message in messages %}\n<|im_start|>{{"user" if message.character.type == "user" else "assistant"}}\n{{message.character.name}}: {{message.text}}<|im_end|>\n{% endfor %}\n<|im_start|>assistant\n`
const llama3 = `<|start_header_id|>system<|end_header_id|>\n\n{{instruction}}<|eot_id|>{% for message in messages %}<|start_header_id|>{{message.role}}<|end_header_id|>\n\n{{message.text | trim}}<|eot_id|>{% endfor %}<|start_header_id|>assistant<|end_header_id|>\n\n`
const phi3 = `{% for message in messages %}<|{{message.role}}|>{{message.text}}<|end|>\n{% endfor %}<|assistant|>`
const chatMlRoleplay = `<|im_start|>system\nRespond as the indicated character using one of the provided descriptions below.\nCharacter Descriptions:\n{% for character in characters %}{{character.name}}: {{character.description}}\n{% endfor %}<|im_end|>\n{% for message in messages %}\n<|im_start|>{{"user" if message.character.type == "user" else "assistant"}}\n{{message.character.name}}: {{message.text}}<|im_end|>\n{% endfor %}\n<|im_start|>assistant\n{{char}}: `
const phi3Roleplay = `<|user|>${defaultSystemMessage}\n{% for character in characters %}{{character.name}}: {{character.description}}\n{% endfor %}<|end|>\n{% for message in messages %}<|{{message.role}}|>\n{{message.character.name}}: {{message.text}}<|end|>\n{% endfor %}<|assistant|>\n{{char}}: `
const llama3Roleplay = `<|start_header_id|>system<|end_header_id|>\n\n${defaultSystemMessage}\n{% for character in characters %}{{character.name}}: {{character.description}}\n{% endfor %}<|eot_id|>{% for message in messages %}<|start_header_id|>{{message.role}}<|end_header_id|>\n\n{{message.character.name}}: {{message.text | trim}}<|eot_id|>{% endfor %}<|start_header_id|>assistant<|end_header_id|>\n\n{{char}}: `

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
        await db.insert(PromptTemplate).values({name: 'ChatML', content: chatMl})
        await db.insert(PromptTemplate).values({name: 'Llama3', content: llama3})
        await db.insert(PromptTemplate).values({name: 'Phi3', content: phi3})
        await db.insert(PromptTemplate).values({name: 'ChatML Roleplay', content: chatMlRoleplay})
        await db.insert(PromptTemplate).values({name: 'Phi 3 Roleplay', content: phi3Roleplay})
        await db.insert(PromptTemplate).values({name: 'Llama 3 Roleplay', content: llama3Roleplay})
    }

    // Initialize a user
    const existingUser = await db.query.User.findFirst({where: eq(User.id, 1)})
    if (!existingUser) {
        logger.info('Creating a default user')
        await db.insert(User).values({id: 1, generatePreset: 1, promptTemplate: 1})
    }
}
