import {createRouter, createWebHistory} from 'vue-router'

import Index from './pages/index.vue'
import CreateChracter from './pages/create-character.vue'
import Characters from './pages/characters.vue'
import Character from './pages/character.vue'
import Chat from './pages/chat.vue'
import Connection from './pages/connection.vue'
import Settings from './pages/settings.vue'

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
            path: '/chat',
            name: 'chat',
            component: Chat,
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
    ],
})
