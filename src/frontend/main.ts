import {createApp} from 'vue'
import {createPinia} from 'pinia'
import Toast, {POSITION} from 'vue-toastification'

import App from './app.vue'
import router from './router'

// Fixture DB data
import '@/db/fixture'

const documentHeight = () => {
    const doc = document.documentElement
    doc.style.setProperty('--doc-height', `${window.innerHeight}px`)
}
window.addEventListener('resize', documentHeight)
documentHeight()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Toast, {position: POSITION.BOTTOM_RIGHT})

app.mount('#app')
