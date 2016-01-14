import {createApp} from 'vue'
import App from './App.vue'
import './styles/index.css'
import 'uno.css'
import router from './router'
import locate from './locates'

const app = createApp(App)
app.use(router)
app.use(locate)
app.mount('#app')
