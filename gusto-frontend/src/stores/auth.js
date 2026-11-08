import { defineStore } from 'pinia'
import axios from 'axios'
import { authAPI } from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('gusto_token') || null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role
  },

  actions: {
    async login(credentials) {
      try {
        const response = await authAPI.login(credentials)
        this.token = response.data.token
        this.user = response.data.user
        
        localStorage.setItem('gusto_token', this.token)
        localStorage.setItem('gusto_user', JSON.stringify(this.user))
        
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        
        return { success: true }
      } catch (error) {
        return { 
          success: false, 
          message: error.response?.data?.message || 'Login failed'
        }
      }
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('gusto_token')
      localStorage.removeItem('gusto_user')
      delete axios.defaults.headers.common['Authorization']
    },

    checkAuth() {
      const token = localStorage.getItem('gusto_token')
      const user = localStorage.getItem('gusto_user')
      
      if (token && user) {
        this.token = token
        this.user = JSON.parse(user)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
    }
  }
})

