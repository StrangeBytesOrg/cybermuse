import {templateCollection, generationPresetCollection, userCollection} from './index'

const defaultTemplate = `Roleplay in this chat with the user using the provided character description below.
{% for character in characters %}{{character.name}}: {{character.description}}
{% endfor %}
{% if lore.length %}Use the following background information as lore.
{% for entry in lore %}
{{ entry.name }}: {{ entry.content }}
{% endfor %}{% endif %}`

const templates = await templateCollection.find()
if (templates.length === 0) {
    console.log('Creating default template')
    await templateCollection.put({
        _id: 'default-template',
        name: 'Default',
        template: defaultTemplate,
    })
}

const user = await userCollection.find()
if (user.length === 0) {
    console.log('Creating default user')
    await userCollection.put({
        _id: 'default-user',
        name: 'Default',
        generatePreset: 'default-generation-preset',
        promptTemplate: 'default-template',
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
