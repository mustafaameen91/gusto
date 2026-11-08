import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './assets/styles/fonts.css' // Import Tajawal font
import './assets/styles/custom.css' // Import custom beautiful styles
import './assets/rtl.css' // Import RTL styles

const app = createApp(App)

// Set RTL globally
app.config.globalProperties.$vuetify = {
  rtl: true
}

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(Toast, {
  position: 'top-left', // Changed to top-left for RTL
  timeout: 3000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  hideProgressBar: false,
  rtl: true // Enable RTL for toast notifications
})

app.mount('#app')

