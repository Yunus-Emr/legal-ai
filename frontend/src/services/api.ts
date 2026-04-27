import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('legal_ai_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Auth ─────────────────────────────────────────────────────
export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data as { access_token: string; user_id: string }
  },
  register: async (name: string, email: string, password: string) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    return data as { access_token: string; user_id: string }
  }
}

// ── Chat ─────────────────────────────────────────────────────
export const chatApi = {
  getSessions: async () => {
    const { data } = await api.get('/chat/sessions')
    return data as { sessions: Array<{ session_id: string; last_activity: string }> }
  },
  getHistory: async (sessionId: string) => {
    const { data } = await api.get(`/chat/${sessionId}`)
    return data as { session_id: string; history: Array<{ role: 'user' | 'assistant'; content: string; created_at: string }> }
  },
  sendMessage: async (query: string, sessionId?: string) => {
    const { data } = await api.post('/chat', { query, session_id: sessionId })
    return data as {
      answer: string
      sources: Array<{ document_name: string; chunk_id?: string; page?: number }>
      session_id: string
    }
  },
}

// ── Documents ─────────────────────────────────────────────────
export const documentsApi = {
  list: async () => {
    const { data } = await api.get('/documents')
    return data as {
      documents: Array<{
        id: string
        filename: string
        size_bytes: number
        chunk_count: number
        created_at: string
        status: 'indexed' | 'processing' | 'error'
      }>
    }
  },

  upload: async (files: File[], onProgress?: (pct: number) => void) => {
    const form = new FormData()
    files.forEach(f => form.append('files', f))
    const { data } = await api.post('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: e => {
        if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100))
      },
    })
    return data
  },

  delete: async (docId: string) => {
    await api.delete(`/documents/${docId}`)
  },

  getStatus: async (docId: string) => {
    const { data } = await api.get(`/documents/${docId}/status`)
    return data
  },
}

// ── Search ────────────────────────────────────────────────────
export const searchApi = {
  search: async (query: string, topK = 5) => {
    const { data } = await api.post('/search', { query, top_k: topK })
    return data as {
      results: Array<{
        chunk_id: string
        document_name: string
        text: string
        score: number
        page?: number
      }>
    }
  },
}

// ── Health ────────────────────────────────────────────────────
export const healthApi = {
  check: async () => {
    const { data } = await api.get('/health')
    return data as {
      status: 'ok' | 'degraded'
      version: string
      opensearch: boolean
      postgres: boolean
    }
  },
}

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardApi = {
  getStats: async () => {
    const { data } = await api.get('/analytics/dashboard')
    return data as {
      total_documents: number
      total_chunks: number
      total_queries: number
      avg_response_time_ms: number
      current_user_name?: string
    }
  },

  getRecentActivity: async () => {
    const { data } = await api.get('/dashboard/activity')
    return data as Array<{
      type: 'query' | 'upload' | 'delete'
      description: string
      timestamp: string
    }>
  },
}

// ── Admin ─────────────────────────────────────────────────────
export const adminApi = {
  getUsers: async () => {
    const { data } = await api.get('/admin/users')
    return data as any[]
  },
  getConfig: async () => {
    const { data } = await api.get('/admin/config')
    return data
  },
  updateConfig: async (config: any) => {
    await api.post('/admin/config', config)
  },
}

export default api
