import {createApp} from 'vue'
import {createPinia} from 'pinia'

import App from './app.vue'
import router from './router'

// Fixture DB data
import {fixtureData} from '@/db/fixture'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// TODO this is a bit hacky, but it works for now
fixtureData().then(() => {
    console.log('Fixture data loaded')
    app.mount('body')
})
