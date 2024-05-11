import {createRouter, createWebHistory} from 'vue-router'

import Index from './pages/index.vue'
import CreateCharacter from './pages/create-character.vue'
import Characters from './pages/characters.vue'
import CreateChat from './pages/create-chat.vue'
import Chats from './pages/chats.vue'
import Character from './pages/character.vue'
import Chat from './pages/chat2.vue'
import ThemeSettings from './pages/theme-settings.vue'
import Templates from './pages/templates.vue'
import Template from './pages/template.vue'
import CreateTemplate from './pages/create-template.vue'
import GenerationSettings from './pages/generation-settings.vue'
import BackendSettings from './pages/backend-settings.vue'
import DownloadModels from './pages/download-models.vue'
import Instruct from './pages/instruct.vue'

export default createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'index',
            component: Index,
        },
        {
            path: '/create-character',
            name: 'create-character',
            component: CreateCharacter,
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
            path: '/create-chat',
            name: 'create-chat',
            component: CreateChat,
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
            path: '/instruct',
            name: 'instruct',
            component: Instruct,
        },
        {
            path: '/theme-settings',
            name: 'settings',
            component: ThemeSettings,
        },
        {
            path: '/create-template',
            name: 'create-template',
            component: CreateTemplate,
        },
        {
            path: '/templates',
            name: 'templates',
            component: Templates,
        },
        {
            path: '/template/:id',
            name: 'template',
            component: Template,
        },
        {
            path: '/generation-settings',
            name: 'generation-settings',
            component: GenerationSettings,
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
    ],
})
