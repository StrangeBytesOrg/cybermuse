import {createRouter, createWebHashHistory} from 'vue-router'
import {useToastStore} from './store'

import Index from './pages/index.vue'
import ErrorPage from './pages/error.vue'

const Character = () => import('@/pages/character.vue')
const Characters = () => import('@/pages/characters.vue')
const CreateCharacter = () => import('@/pages/character-create.vue')
const Chat = () => import('@/pages/chat.vue')
const Chats = () => import('@/pages/chats.vue')
const ChatEdit = () => import('@/pages/chat-edit.vue')
const Lore = () => import('@/pages/lore.vue')
const LoreEdit = () => import('@/pages/lore-edit.vue')
const LoreCreate = () => import('@/pages/lore-create.vue')
const CreateChat = () => import('@/pages/chat-create.vue')
const Templates = () => import('@/pages/templates.vue')
const Presets = () => import('@/pages/presets.vue')
const Settings = () => import('@/pages/settings.vue')
const Hub = () => import('@/pages/hub.vue')
const About = () => import('@/pages/about.vue')

const router = createRouter({
    scrollBehavior() {
        document.getElementById('main')?.scrollTo({top: 0, left: 0})
    },
    history: createWebHashHistory(),
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
            path: '/presets',
            name: 'presets',
            component: Presets,
            meta: {title: 'Presets'},
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

router.onError((error) => {
    console.error('[RouterError]', error)
    const toast = useToastStore()
    toast.error(error.message)
})

export default router
