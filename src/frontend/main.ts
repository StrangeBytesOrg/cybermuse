import {createApp} from 'vue'
import {createPinia} from 'pinia'

import App from './app.vue'
import router from './router'

const documentHeight = () => {
    const doc = document.documentElement
    doc.style.setProperty('--doc-height', `${window.innerHeight}px`)
}
window.addEventListener('resize', documentHeight)
documentHeight()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
