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
import Templates from './pages/templates.vue'
import CreateTemplate from './pages/template-create.vue'
import Presets from './pages/presets.vue'
import CreatePreset from './pages/preset-create.vue'
import Settings from './pages/settings.vue'
import Hub from './pages/hub.vue'
import About from './pages/about.vue'
import ErrorPage from './pages/error.vue'

export default createRouter({
    scrollBehavior() {
        document.getElementById('main')?.scrollTo({top: 0, left: 0})
    },
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'index',
            component: Index,
            meta: {title: 'Cybermuse'},
        },
        {
            path: '/characters',
            name: 'characters',
            component: Characters,
            meta: {title: 'Characters'},
        },
        {
            path: '/character/:id',
            name: 'character',
            component: Character,
            meta: {title: 'Edit Character', back: true},
        },
        {
            path: '/create-character',
            name: 'create-character',
            component: CreateCharacter,
            meta: {title: 'Create Character', back: true},
        },
        {
            path: '/chats',
            name: 'chats',
            component: Chats,
            meta: {title: 'Chats'},
        },
        {
            path: '/chat/:id',
            name: 'chat',
            component: Chat,
            meta: {back: true},
        },
        {
            path: '/edit-chat/:id',
            name: 'edit-chat',
            component: ChatEdit,
            meta: {title: 'Edit Chat', back: true},
        },
        {
            path: '/create-chat',
            name: 'create-chat',
            component: CreateChat,
            meta: {title: 'Create Chat', back: true},
        },
        {
            path: '/lore',
            name: 'lore',
            component: Lore,
            meta: {title: 'Lore'},
        },
        {
            path: '/lore/:id',
            name: 'edit-lore',
            component: LoreEdit,
            meta: {title: 'Edit Lore', back: true},
        },
        {
            path: '/create-lore',
            name: 'create-lore',
            component: LoreCreate,
            meta: {title: 'Create Lore', back: true},
        },
        {
            path: '/templates',
            name: 'templates',
            component: Templates,
            meta: {title: 'Templates'},
        },
        {
            path: '/create-template',
            name: 'create-template',
            component: CreateTemplate,
            meta: {title: 'Create Template', back: true},
        },
        {
            path: '/presets',
            name: 'presets',
            component: Presets,
            meta: {title: 'Presets'},
        },
        {
            path: '/create-preset',
            name: 'create-preset',
            component: CreatePreset,
            meta: {title: 'Create Preset', back: true},
        },
        {
            path: '/settings',
            name: 'settings',
            component: Settings,
            meta: {title: 'Settings'},
        },
        {
            path: '/hub',
            name: 'hub',
            component: Hub,
            meta: {title: 'Hub'},
        },
        {
            path: '/about',
            name: 'about',
            component: About,
            meta: {title: 'About'},
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: ErrorPage,
            meta: {title: 'Error'},
        },
    ],
})
