import { Plus, MessageSquare, Trash2, Edit3, Search, X } from 'lucide-react'
import { useChatStore } from '../store/chatStore'
import { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function ChatHistoryPanel({ isOpen, onClose }: Props) {
  const { sessions, activeSessionId, createSession, switchSession, deleteSession, renameSession } = useChatStore()
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const filtered = sessions.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()),
  )

  const grouped = {
    today: [] as typeof sessions,
    yesterday: [] as typeof sessions,
    thisWeek: [] as typeof sessions,
    older: [] as typeof sessions,
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86400000)
  const weekStart = new Date(todayStart.getTime() - 7 * 86400000)

  filtered.forEach(s => {
    const d = new Date(s.updatedAt)
    if (d >= todayStart) grouped.today.push(s)
    else if (d >= yesterdayStart) grouped.yesterday.push(s)
    else if (d >= weekStart) grouped.thisWeek.push(s)
    else grouped.older.push(s)
  })

  const startRename = (id: string, currentTitle: string) => {
    setEditingId(id)
    setEditTitle(currentTitle)
  }

  const submitRename = () => {
    if (editingId && editTitle.trim()) {
      renameSession(editingId, editTitle.trim())
    }
    setEditingId(null)
  }

  const renderGroup = (label: string, items: typeof sessions) => {
    if (items.length === 0) return null
    return (
      <div key={label}>
        <div className="chat-history-group-label">{label}</div>
        {items.map(s => (
          <div
            key={s.id}
            className={`chat-history-item ${s.id === activeSessionId ? 'active' : ''}`}
            onClick={() => switchSession(s.id)}
          >
            <MessageSquare size={14} />
            <div className="chat-history-item-body">
              {editingId === s.id ? (
                <input
                  className="chat-history-rename-input"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={submitRename}
                  onKeyDown={e => e.key === 'Enter' && submitRename()}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="chat-history-item-title">{s.title}</span>
              )}
              <span className="chat-history-item-meta">
                {s.messages.length} mesaj
              </span>
            </div>
            <div className="chat-history-item-actions" onClick={e => e.stopPropagation()}>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => startRename(s.id, s.title)}
                data-tooltip="Yeniden adlandır"
              >
                <Edit3 size={12} />
              </button>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => deleteSession(s.id)}
                data-tooltip="Sil"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`chat-history-panel ${isOpen ? 'open' : ''}`}>
      <div className="chat-history-header">
        <h3>Sohbet Geçmişi</h3>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <button
        className="btn btn-primary chat-history-new-btn"
        onClick={() => createSession()}
      >
        <Plus size={15} />
        Yeni Sohbet
      </button>

      <div className="chat-history-search">
        <Search size={14} />
        <input
          type="text"
          placeholder="Sohbet ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="chat-history-list">
        {sessions.length === 0 ? (
          <div className="chat-history-empty">
            <MessageSquare size={20} />
            <span>Henüz sohbet yok</span>
          </div>
        ) : (
          <>
            {renderGroup('Bugün', grouped.today)}
            {renderGroup('Dün', grouped.yesterday)}
            {renderGroup('Bu Hafta', grouped.thisWeek)}
            {renderGroup('Daha Eski', grouped.older)}
          </>
        )}
      </div>
    </div>
  )
}
