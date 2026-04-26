import { useState, useEffect } from 'react'
import { History } from 'lucide-react'
import ChatBox from '../components/ChatBox'
import ChatHistoryPanel from '../components/ChatHistoryPanel'
import { useChatStore } from '../store/chatStore'

export default function ChatPage() {
  const [historyOpen, setHistoryOpen] = useState(true)
  const { activeSessionId, createSession, fetchSessions, sessions } = useChatStore()

  useEffect(() => {
    fetchSessions()
  }, []) // Fetch once on mount

  // Auto-create session if fetching finishes and still none
  useEffect(() => {
    if (sessions.length === 0 && !activeSessionId && !isLoading) {
      createSession()
    }
  }, [sessions.length, activeSessionId, isLoading, createSession])

  return (
    <>
      <div className="top-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => setHistoryOpen(!historyOpen)}
            data-tooltip="Sohbet geçmişi"
          >
            <History size={17} />
          </button>
          <div>
            <div className="header-title">💬 Hukuki Sohbet</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              RAG destekli yapay zeka hukuk asistanı
            </div>
          </div>
        </div>
        <div className="header-actions">
          <span className="badge badge-success">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--success)',
                display: 'inline-block',
              }}
            />
            Aktif
          </span>
        </div>
      </div>
      <div className="chat-page-layout">
        <ChatHistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ChatBox />
        </div>
      </div>
    </>
  )
}
