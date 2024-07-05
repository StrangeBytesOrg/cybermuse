import {createRouter, createWebHashHistory} from 'vue-router'

import Index from './pages/index.vue'
import Character from './pages/character.vue'
import Characters from './pages/characters.vue'
import CreateCharacter from './pages/character-create.vue'
import Chat from './pages/chat.vue'
import Chats from './pages/chats.vue'
import CreateChat from './pages/chat-create.vue'
import Templates from './pages/templates.vue'
import CreateTemplate from './pages/template-create.vue'
import Preset from './pages/preset.vue'
import Presets from './pages/presets.vue'
import CreatePreset from './pages/preset-create.vue'
import BackendSettings from './pages/backend-settings.vue'
import DownloadModels from './pages/download-models.vue'
import Instruct from './pages/instruct.vue'
import ThemeSettings from './pages/theme-settings.vue'

export default createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'index',
            component: Index,
        },
        {
            path: '/characters',
            name: 'characters',
            component: Characters,
        },
        {
            path: '/character',
            name: 'character',
            component: Character,
        },
        {
            path: '/create-character',
            name: 'create-character',
            component: CreateCharacter,
        },
        {
            path: '/chats',
            name: 'chats',
            component: Chats,
        },
        {
            path: '/chat',
            name: 'chat',
            component: Chat,
        },
        {
            path: '/create-chat',
            name: 'create-chat',
            component: CreateChat,
        },
        {
            path: '/templates',
            name: 'templates',
            component: Templates,
        },
        {
            path: '/create-template',
            name: 'create-template',
            component: CreateTemplate,
        },
        {
            path: '/presets',
            name: 'presets',
            component: Presets,
        },
        {
            path: '/preset/:id',
            name: 'preset',
            component: Preset,
        },
        {
            path: '/create-preset',
            name: 'create-preset',
            component: CreatePreset,
        },
        {
            path: '/backend-settings',
            name: 'backend-settings',
            component: BackendSettings,
        },
        {
            path: '/download-models',
            name: 'download-models',
            component: DownloadModels,
        },
        {
            path: '/instruct',
            name: 'instruct',
            component: Instruct,
        },
        {
            path: '/theme-settings',
            name: 'settings',
            component: ThemeSettings,
        },
    ],
})
