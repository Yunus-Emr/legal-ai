import { create } from 'zustand'
import { authApi } from '../services/api'
import api from '../services/api'

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

async function fetchMe(): Promise<User | null> {
  try {
    const { data } = await api.get('/auth/me')
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as 'admin' | 'user',
    }
  } catch {
    return null
  }
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
      localStorage.setItem('legal_ai_token', response.access_token)
      // Fetch real user data from /me
      const user = await fetchMe()
      if (user) {
        localStorage.setItem('legal_ai_user', JSON.stringify(user))
        set({ user, token: response.access_token, isAuthenticated: true, isLoading: false })
      } else {
        // Fallback if /me fails
        const fallback: User = {
          id: response.user_id,
          name: email.split('@')[0],
          email,
          role: 'user',
        }
        localStorage.setItem('legal_ai_user', JSON.stringify(fallback))
        set({ user: fallback, token: response.access_token, isAuthenticated: true, isLoading: false })
      }
    } catch (e) {
      set({ isLoading: false })
      throw e
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true })
    try {
      const response = await authApi.register(name, email, password)
      localStorage.setItem('legal_ai_token', response.access_token)
      const user = await fetchMe() ?? { id: response.user_id, name, email, role: 'user' as const }
      localStorage.setItem('legal_ai_user', JSON.stringify(user))
      set({ user, token: response.access_token, isAuthenticated: true, isLoading: false })
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
        // Refresh role from server in background
        fetchMe().then(freshUser => {
          if (freshUser) {
            localStorage.setItem('legal_ai_user', JSON.stringify(freshUser))
            set({ user: freshUser })
          }
        })
      } catch {
        localStorage.removeItem('legal_ai_token')
        localStorage.removeItem('legal_ai_user')
      }
    }
  },
}))

