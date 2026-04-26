import { create } from 'zustand'
import { authApi } from '../services/api'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      const response = await authApi.login(email, password)
      const mockUser: User = {
        id: response.user_id,
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email,
        role: email.includes('admin') ? 'admin' : 'user',
      }
      localStorage.setItem('legal_ai_token', response.access_token)
      localStorage.setItem('legal_ai_user', JSON.stringify(mockUser))
      set({ user: mockUser, token: response.access_token, isAuthenticated: true, isLoading: false })
    } catch (e) {
      set({ isLoading: false })
      throw e
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true })
    try {
      const response = await authApi.register(name, email, password)
      const mockUser: User = { id: response.user_id, name, email, role: 'user' }
      localStorage.setItem('legal_ai_token', response.access_token)
      localStorage.setItem('legal_ai_user', JSON.stringify(mockUser))
      set({ user: mockUser, token: response.access_token, isAuthenticated: true, isLoading: false })
    } catch (e) {
      set({ isLoading: false })
      throw e
    }
  },

  logout: () => {
    localStorage.removeItem('legal_ai_token')
    localStorage.removeItem('legal_ai_user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  hydrate: () => {
    const token = localStorage.getItem('legal_ai_token')
    const userStr = localStorage.getItem('legal_ai_user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User
        set({ user, token, isAuthenticated: true })
      } catch {
        localStorage.removeItem('legal_ai_token')
        localStorage.removeItem('legal_ai_user')
      }
    }
  },
}))
