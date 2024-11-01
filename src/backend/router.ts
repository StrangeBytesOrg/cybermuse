import {t} from './trpc.js'
import {templatesRoutes} from './controllers/templates.js'
import {characterRouter} from './controllers/character.js'
import {messageRouter} from './controllers/message.js'
import {chatRouter} from './controllers/chats.js'
import {loreRouter} from './controllers/lore.js'
import {generatePresetsRouter} from './controllers/generate-presets.js'
import {swipeRouter} from './controllers/swipes.js'
import {modelsRouter} from './controllers/models.js'
import {llamaCppRouter} from './controllers/llama-cpp.js'
import {generateRouter} from './controllers/generate.js'

export const appRouter = t.router({
    characters: characterRouter,
    chats: chatRouter,
    messages: messageRouter,
    lore: loreRouter,
    templates: templatesRoutes,
    generatePresets: generatePresetsRouter,
    swipes: swipeRouter,
    generate: generateRouter,
    models: modelsRouter,
    llamaCpp: llamaCppRouter,
})
export type AppRouter = typeof appRouter
