import {t} from './trpc.js'
import {templatesRoutes} from './controllers/templates.js'

export const appRouter = t.router({
    templates: templatesRoutes,
})
export type AppRouter = typeof appRouter
