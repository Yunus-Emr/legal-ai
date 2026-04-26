import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Send, Bot, User, FileText, RotateCcw } from 'lucide-react'
import { useChatStore } from '../store/chatStore'
import { chatApi } from '../services/api'
import toast from 'react-hot-toast'

export default function ChatBox() {
  const { messages, addMessage, isLoading, setLoading } = useChatStore()
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [input])

  const handleSend = async () => {
    const query = input.trim()
    if (!query || isLoading) return

    setInput('')
    addMessage({ role: 'user', content: query, timestamp: new Date() })
    setLoading(true)

    try {
      const res = await chatApi.sendMessage(query)
      addMessage({
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        timestamp: new Date(),
      })
    } catch (err) {
      toast.error('Yanıt alınamadı. Lütfen tekrar deneyin.')
      addMessage({
        role: 'assistant',
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date(),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const { clearMessages } = useChatStore()

  return (
    <div className="chat-layout">
      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state" style={{ marginTop: 80 }}>
            <div className="empty-state-icon">
              <Bot size={32} />
            </div>
            <h2 className="empty-state-title">Hukuki Sorunuzu Sorun</h2>
            <p className="empty-state-text">
              Yüklediğiniz hukuki dokümanlar üzerinde soru sorabilirsiniz.
              Yapay zeka ilgili maddeleri bulup size yanıt verir.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message-row ${msg.role === 'user' ? 'user' : ''}`}
          >
            <div
              className={`message-avatar ${msg.role === 'assistant' ? 'ai' : 'user'}`}
            >
              {msg.role === 'user' ? <User size={16} /> : '⚖'}
            </div>
            <div className="message-content">
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
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 8,
          }}
        >
          <button
            className="btn btn-ghost btn-sm"
            onClick={clearMessages}
            style={{ gap: 4 }}
          >
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
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            data-tooltip="Gönder"
          >
            <Send size={16} />
          </button>
        </div>
        <p
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          Enter → Gönder &nbsp;·&nbsp; Shift+Enter → Yeni satır
        </p>
      </div>
    </div>
  )
}
