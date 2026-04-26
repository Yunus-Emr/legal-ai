import { create } from 'zustand'
import { chatApi } from '../services/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{ document_name: string; chunk_id?: string; page?: number } | string>
  timestamp: Date
}

interface Session {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface ChatState {
  sessions: Session[]
  activeSessionId: string | null
  messages: Message[]
  isLoading: boolean
  addMessage: (msg: Message) => void
  setLoading: (v: boolean) => void
  clearMessages: () => void
  createSession: () => string
  switchSession: (id: string) => Promise<void>
  deleteSession: (id: string) => void
  renameSession: (id: string, title: string) => void
  fetchSessions: () => Promise<void>
}

const generateId = () => Math.random().toString(36).slice(2, 10)

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  isLoading: false,

  addMessage: msg => {
    const { activeSessionId, sessions } = get()
    const newMessages = [...get().messages, msg]
    set({ messages: newMessages })

    if (activeSessionId) {
      set({
        sessions: sessions.map(s =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: newMessages,
                updatedAt: new Date(),
                title: s.messages.length === 0 && msg.role === 'user'
                  ? msg.content.slice(0, 40) + (msg.content.length > 40 ? '...' : '')
                  : s.title,
              }
            : s,
        ),
      })
    }
  },

  setLoading: v => set({ isLoading: v }),

  clearMessages: () => {
    const { activeSessionId, sessions } = get()
    set({ messages: [] })
    if (activeSessionId) {
      set({
        sessions: sessions.map(s =>
          s.id === activeSessionId ? { ...s, messages: [], updatedAt: new Date() } : s,
        ),
      })
    }
  },

  createSession: () => {
    const { sessions } = get()
    // Save current messages to current session before switching
    const id = generateId()
    const newSession: Session = {
      id,
      title: 'Yeni Sohbet',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set({
      sessions: [newSession, ...sessions],
      activeSessionId: id,
      messages: [],
    })
    return id
  },

  fetchSessions: async () => {
    try {
      const res = await chatApi.getSessions()
      const loaded: Session[] = res.sessions.map(s => ({
        id: s.session_id,
        title: 'Sohbet ' + s.session_id.substring(0, 5),
        messages: [],
        createdAt: new Date(s.last_activity),
        updatedAt: new Date(s.last_activity)
      }))
      set({ sessions: loaded })
      if (loaded.length > 0 && !get().activeSessionId) {
        get().switchSession(loaded[0].id)
      }
    } catch(e) {
      console.error("Session fetch failed", e)
    }
  },

  switchSession: async id => {
    set({ activeSessionId: id, isLoading: true })
    try {
      const res = await chatApi.getHistory(id)
      const mapped: Message[] = res.history.map(h => ({
         role: h.role, 
         content: h.content, 
         timestamp: new Date(h.created_at)
      }))
      set({ messages: mapped, isLoading: false })
    } catch(e) {
      console.error("History fetch failed", e)
      set({ isLoading: false })
    }
  },

  deleteSession: id => {
    const { sessions, activeSessionId } = get()
    const filtered = sessions.filter(s => s.id !== id)
    if (activeSessionId === id) {
      const next = filtered[0]
      set({
        sessions: filtered,
        activeSessionId: next?.id ?? null,
        messages: next?.messages ?? [],
      })
    } else {
      set({ sessions: filtered })
    }
  },

  renameSession: (id, title) => {
    set({
      sessions: get().sessions.map(s =>
        s.id === id ? { ...s, title } : s,
      ),
    })
  },
}))
