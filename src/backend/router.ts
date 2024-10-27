import {t} from './trpc.js'
import {templatesRoutes} from './controllers/templates.js'
import {characterRouter} from './controllers/character.js'
import {messageRouter} from './controllers/message.js'

export const appRouter = t.router({
    templates: templatesRoutes,
    messages: messageRouter,
    characters: characterRouter,
})
export type AppRouter = typeof appRouter
