import { createApp } from 'vue'
import "cesium/Build/Cesium/Widgets/widgets.css"
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')
