import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(true)
  let _vuetifyTheme = null

  function init(vuetifyTheme) {
    _vuetifyTheme = vuetifyTheme
    const saved = localStorage.getItem('gusto-theme')
    if (saved) {
      isDark.value = saved === 'dark'
    }
    apply()
  }

  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem('gusto-theme', isDark.value ? 'dark' : 'light')
    apply()
  }

  function apply() {
    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
    if (_vuetifyTheme) {
      const themeName = isDark.value ? 'cafeDark' : 'cafeLight'
      if (_vuetifyTheme.change) {
        _vuetifyTheme.change(themeName)
      } else {
        _vuetifyTheme.global.name.value = themeName
      }
    }
  }

  return { isDark, init, toggle }
})
