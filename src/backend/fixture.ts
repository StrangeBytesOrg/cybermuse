import {eq} from 'drizzle-orm'
import {db, User, Character, Chat, ChatCharacters, PromptTemplate, GeneratePreset} from './db.js'
import {logger} from './logging.js'

// TODO output characters and lore as a single string for easier use
const defaultTemplate = `Roleplay in this chat with the user using the provided character description below.
{% for character in characters %}{{character.name}}: {{character.description}}
{% endfor %}
{% if lore.length %}Use the following background information as lore.
{% for entry in lore %}
{{ entry.name }}: {{ entry.content }}
{% endfor %}{% endif %}`

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
            name: 'Default',
            template: defaultTemplate,
        })
    }

    // Initialize a user
    const existingUser = await db.query.User.findFirst({where: eq(User.id, 1)})
    if (!existingUser) {
        logger.info('Creating a default user')
        await db.insert(User).values({id: 1, generatePreset: 1, promptTemplate: 1})
    }
}
