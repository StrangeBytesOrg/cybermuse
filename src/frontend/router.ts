import {createRouter, createWebHistory} from 'vue-router'

import Index from './pages/index.vue'
import Character from './pages/character.vue'
import Characters from './pages/characters.vue'
import CreateCharacter from './pages/character-create.vue'
import Chat from './pages/chat.vue'
import Chats from './pages/chats.vue'
import ChatEdit from './pages/chat-edit.vue'
import Lore from './pages/lore.vue'
import LoreEdit from './pages/lore-edit.vue'
import LoreCreate from './pages/lore-create.vue'
import CreateChat from './pages/chat-create.vue'
import ConnectionSettings from './pages/connection.vue'
import Templates from './pages/templates.vue'
import CreateTemplate from './pages/template-create.vue'
import Presets from './pages/presets.vue'
import CreatePreset from './pages/preset-create.vue'
import ThemeSettings from './pages/theme-settings.vue'
import ErrorPage from './pages/error.vue'

export default createRouter({
    history: createWebHistory(),
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
            path: '/character/:id',
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
            path: '/chat/:id',
            name: 'chat',
            component: Chat,
        },
        {
            path: '/edit-chat/:id',
            name: 'edit-chat',
            component: ChatEdit,
        },
        {
            path: '/create-chat',
            name: 'create-chat',
            component: CreateChat,
        },
        {
            path: '/lore',
            name: 'lore',
            component: Lore,
        },
        {
            path: '/lore/:id',
            name: 'edit-lore',
            component: LoreEdit,
        },
        {
            path: '/create-lore',
            name: 'create-lore',
            component: LoreCreate,
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
            path: '/create-preset',
            name: 'create-preset',
            component: CreatePreset,
        },
        {
            path: '/connection',
            name: 'connection-settings',
            component: ConnectionSettings,
        },
        // {
        //     path: '/instruct',
        //     name: 'instruct',
        //     component: Instruct,
        // },
        {
            path: '/theme-settings',
            name: 'settings',
            component: ThemeSettings,
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: ErrorPage,
        },
    ],
})
