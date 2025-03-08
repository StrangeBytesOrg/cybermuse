import {db} from './index'

const defaultTemplate = `Roleplay in this chat with the user using the provided character description below.
{{ characters }}
{{#if lore}}Use the following background information as lore.
{{ lore }}{{/if}}`

export const fixtureData = async () => {
    const users = await db.users.toArray()
    if (users.length === 0) {
        console.log('Creating default user')
        await db.users.put({
            id: 'default-user',
            lastUpdate: 0,
            name: 'Default',
            generatePresetId: 'default-generation-preset',
            promptTemplateId: 'default-template',
        })
    }

    // Characters
    const characters = await db.characters.toArray()
    if (characters.length === 0) {
        console.log('Creating default characters')
        await db.characters.put({
            id: 'default-user-character',
            lastUpdate: 0,
            name: 'User',
            type: 'user',
            description: 'The user of the system.',
        })
        await db.characters.put({
            id: 'default-character',
            lastUpdate: 0,
            name: 'Assistant',
            type: 'character',
            description: 'A helpful assistant designed to guide you through the process.',
        })
    }

    const templates = await db.templates.toArray()
    if (templates.length === 0) {
        console.log('Creating default template')
        await db.templates.put({
            id: 'default-template',
            lastUpdate: 0,
            name: 'Default',
            template: defaultTemplate,
        })
    }

    const generationPresets = await db.generationPresets.toArray()
    if (generationPresets.length === 0) {
        console.log('Creating default generation preset')
        await db.generationPresets.put({
            id: 'default-generation-preset',
            lastUpdate: 0,
            name: 'Default',
            maxTokens: 512,
            temperature: 1,
            repeatPenalty: {},
        })
    }
}
