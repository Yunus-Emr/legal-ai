import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Send, Bot, User, FileText, RotateCcw, Copy, Check } from 'lucide-react'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const API_BASE = 'http://localhost:8000/api/v1'

export default function ChatBox() {
  const { messages, addMessage, isLoading, setLoading, activeSessionId } = useChatStore()
  const { token, isAuthenticated } = useAuthStore()
  const [input, setInput] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { clearMessages } = useChatStore()

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, streamingText])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [input])

  const handleCopy = useCallback((text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
    toast.success('Kopyalandı!')
  }, [])

  const handleSend = async () => {
    const query = input.trim()
    if (!query || isLoading || isStreaming) return

    setInput('')
    addMessage({ role: 'user', content: query, timestamp: new Date() })
    setIsStreaming(true)
    setStreamingText('')

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, session_id: activeSessionId || undefined }),
      })

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let sources: any[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'token') {
              accumulated += event.token
              setStreamingText(accumulated)
            } else if (event.type === 'sources') {
              sources = event.sources
            } else if (event.type === 'done') {
              // Finalize
              addMessage({
                role: 'assistant',
                content: accumulated,
                sources,
                timestamp: new Date(),
              })
              setStreamingText('')
            } else if (event.type === 'error') {
              throw new Error(event.message)
            }
          } catch {
            // Skip parse errors
          }
        }
      }
    } catch (err: any) {
      toast.error('Yanıt alınamadı. Lütfen tekrar deneyin.')
      if (streamingText) {
        // Save what we got so far
        addMessage({ role: 'assistant', content: streamingText + '...', timestamp: new Date() })
      } else {
        addMessage({ role: 'assistant', content: 'Üzgünüm, bir hata oluştu.', timestamp: new Date() })
      }
      setStreamingText('')
    } finally {
      setIsStreaming(false)
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isBusy = isLoading || isStreaming

  return (
    <div className="chat-layout">
      {/* Guest tip banner */}
      {!isAuthenticated && (
        <div className="chat-guest-tip">
          💡 Sohbet geçmişini kaydetmek ve doküman yüklemek için{' '}
          <a onClick={() => navigate('/login')}>giriş yapın</a> veya{' '}
          <a onClick={() => navigate('/register')}>kayıt olun</a>.
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && !isStreaming && (
          <div className="empty-state" style={{ marginTop: 80 }}>
            <div className="empty-state-icon">
              <Bot size={32} />
            </div>
            <h2 className="empty-state-title">Hukuki Sorunuzu Sorun</h2>
            <p className="empty-state-text">
              Yüklediğiniz hukuki dokümanlar üzerinde soru sorabilirsiniz.
              Yapay zeka ilgili maddeleri bulup size yanıt verir.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
              {[
                'Kira artış limiti nedir?',
                'İş sözleşmesi feshi şartları?',
                'Tazminat hesaplama nasıl yapılır?',
              ].map(q => (
                <button
                  key={q}
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setInput(q); textareaRef.current?.focus() }}
                  style={{ fontSize: 12, border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message-row ${msg.role === 'user' ? 'user' : ''}`}>
            <div className={`message-avatar ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
              {msg.role === 'user' ? <User size={16} /> : '⚖'}
            </div>
            <div className="message-content" style={{ position: 'relative' }}>
              {/* Copy button */}
              <button
                className="msg-copy-btn"
                onClick={() => handleCopy(msg.content, idx)}
                title="Kopyala"
              >
                {copiedIdx === idx ? <Check size={12} /> : <Copy size={12} />}
              </button>

              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>

              {msg.sources && msg.sources.length > 0 && (
                <div className="message-sources">
                  <div className="message-sources-title">📎 Kaynaklar</div>
                  {msg.sources.map((src, i) => (
                    <span key={i} className="source-chip">
                      <FileText size={10} />
                      {typeof src === 'string' ? src : src.document_name}
                      {typeof src !== 'string' && src.page && ` · s.${src.page}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && streamingText && (
          <div className="message-row">
            <div className="message-avatar ai">⚖</div>
            <div className="message-content streaming">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown>
              <span className="streaming-cursor" />
            </div>
          </div>
        )}

        {/* Typing indicator (before streaming starts) */}
        {isStreaming && !streamingText && (
          <div className="message-row">
            <div className="message-avatar ai">⚖</div>
            <div className="typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={clearMessages} style={{ gap: 4 }}>
            <RotateCcw size={13} />
            Temizle
          </button>
        </div>
        <div className="chat-input-container">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder="Hukuki sorunuzu yazın... (Enter ile gönderin)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isBusy}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isBusy}
            data-tooltip="Gönder"
          >
            <Send size={16} />
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
          Enter → Gönder &nbsp;·&nbsp; Shift+Enter → Yeni satır
        </p>
      </div>
    </div>
  )
}
