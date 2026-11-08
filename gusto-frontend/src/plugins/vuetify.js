import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { ar } from 'vuetify/locale'
import '@mdi/font/css/materialdesignicons.css'

const cafeDark = {
  dark: true,
  colors: {
    primary: '#3FA7B9',
    secondary: '#84967A',
    accent: '#D4A574',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
    background: '#16191b',
    surface: '#1f2427',
    'on-background': '#e8e4df',
    'on-surface': '#e8e4df'
  }
}

const cafeLight = {
  dark: false,
  colors: {
    primary: '#046375',
    secondary: '#84967A',
    accent: '#A16207',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
    background: '#f5f2ed',
    surface: '#ffffff',
    'on-background': '#2c2419',
    'on-surface': '#2c2419'
  }
}

export default createVuetify({
  components,
  directives,
  locale: {
    locale: 'ar',
    fallback: 'en',
    messages: { ar }
  },
  rtl: {
    ar: true
  },
  theme: {
    defaultTheme: 'cafeDark',
    themes: {
      cafeDark,
      cafeLight
    }
  },
  icons: {
    defaultSet: 'mdi'
  }
})
