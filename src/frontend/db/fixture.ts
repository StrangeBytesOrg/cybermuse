import {characterCollection, templateCollection, generationPresetCollection, userCollection} from './index'

const defaultTemplate = `Roleplay in this chat with the user using the provided character description below.
{% for character in characters %}{{character.name}}: {{character.description}}
{% endfor %}
{% if lore.length %}Use the following background information as lore.
{% for book in lore %}
{{ book.name }}
{% for entry in book.entries %}{{ entry.name}}: {{entry.content}}{% endfor %}
{% endfor %}{% endif %}`

const users = await userCollection.find()
if (users.length === 0) {
    console.log('Creating default user')
    await userCollection.put({
        _id: 'default-user',
        name: 'Default',
        generatePreset: 'default-generation-preset',
        promptTemplate: 'default-template',
    })
}

// Characters
const characters = await characterCollection.find()
if (characters.length === 0) {
    console.log('Creating default characters')
    await characterCollection.put({
        _id: 'default-user-character',
        name: 'User',
        type: 'user',
        description: 'The user of the system.',
    })
    await characterCollection.put({
        _id: Math.random().toString(36).slice(2),
        name: 'Assistant',
        type: 'character',
        description: 'A helpful assistant designed to guide you through the process.',
    })
}

const templates = await templateCollection.find()
if (templates.length === 0) {
    console.log('Creating default template')
    await templateCollection.put({
        _id: 'default-template',
        name: 'Default',
        template: defaultTemplate,
    })
}

const generationPresets = await generationPresetCollection.find()
if (generationPresets.length === 0) {
    console.log('Creating default generation preset')
    await generationPresetCollection.put({
        _id: 'default-generation-preset',
        name: 'Default',
        context: 1024,
        maxTokens: 64,
        temperature: 0.5,
        seed: -1,
    })
}
