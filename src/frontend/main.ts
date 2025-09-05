import {createApp} from 'vue'
import {createPinia} from 'pinia'
import {createPersistedState} from 'pinia-plugin-persistedstate'

import App from './app.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()
pinia.use(createPersistedState())

app.use(pinia)
app.use(router)

app.config.errorHandler = (err, instance, info) => {
    console.error('[VueError', info, err)
}

app.mount('body')
