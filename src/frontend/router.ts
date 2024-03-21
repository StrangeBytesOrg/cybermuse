import {createRouter, createWebHistory} from 'vue-router'

import Index from './pages/index.vue'
import CreateChracter from './pages/create-character.vue'
import Characters from './pages/characters.vue'
import Chats from './pages/chats.vue'
import Character from './pages/character.vue'
import Chat from './pages/chat.vue'
import Connection from './pages/connection.vue'
import Settings from './pages/settings.vue'
import BackendSettings from './pages/backend-settings.vue'
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
            component: CreateChracter,
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
            path: '/connection',
            name: 'connection',
            component: Connection,
        },
        {
            path: '/settings',
            name: 'settings',
            component: Settings,
        },
        {
            path: '/backend-settings',
            name: 'backend-settings',
            component: BackendSettings,
        },
    ],
})
