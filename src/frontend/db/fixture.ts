import {db, characterCollection, templateCollection, generationPresetCollection} from '@/db'

const defaultTemplate = `Roleplay in this chat with the user using the provided character description below.
{{ characters }}
{% if lore %}
Use the following background information as lore.
{{ lore }}{% endif %}`

export const fixtureData = async () => {
    const characters = await db.table('characters').toArray()
    if (characters.length === 0) {
        console.log('Creating default characters')
        await characterCollection.put({
            id: 'default-user-character',
            lastUpdate: 0,
            name: 'User',
            description: 'The user of the system.',
            shortDescription: 'A default user character you can use.',
        })
    }

    const templates = await db.table('templates').toArray()
    if (templates.length === 0) {
        console.log('Creating default template')
        await templateCollection.put({
            id: 'default-template',
            lastUpdate: 0,
            name: 'Default',
            template: defaultTemplate,
        })
    }

    const generationPresets = await db.table('generationPresets').toArray()
    if (generationPresets.length === 0) {
        console.log('Creating default generation preset')
        await generationPresetCollection.put({
            id: 'default-generation-preset',
            lastUpdate: 0,
            name: 'Default',
            maxTokens: 512,
        })
    }
}
