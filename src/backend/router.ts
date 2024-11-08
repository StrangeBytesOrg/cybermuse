import {t} from './trpc.js'
import {generateRouter} from './controllers/generate.js'
import {modelsRouter} from './controllers/models.js'
import {llamaCppRouter} from './controllers/llama-cpp.js'
import {avatarRouter} from './controllers/avatar.js'

export const appRouter = t.router({
    generate: generateRouter,
    models: modelsRouter,
    llamaCpp: llamaCppRouter,
    avatars: avatarRouter,
})
export type AppRouter = typeof appRouter
