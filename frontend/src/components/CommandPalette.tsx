import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, LayoutDashboard, MessageSquare, Upload, FileText,
  BarChart3, Shield, Command,
} from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  icon: typeof Search
  path: string
  category: string
}

const commands: CommandItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', category: 'Sayfalar' },
  { id: 'chat', label: 'Sohbet', icon: MessageSquare, path: '/chat', category: 'Sayfalar' },
  { id: 'upload', label: 'Doküman Yükle', icon: Upload, path: '/upload', category: 'Sayfalar' },
  { id: 'documents', label: 'Dokümanlar', icon: FileText, path: '/documents', category: 'Sayfalar' },
  { id: 'search', label: 'Semantik Arama', icon: Search, path: '/search', category: 'Sayfalar' },
  { id: 'analytics', label: 'Analitik', icon: BarChart3, path: '/analytics', category: 'Sayfalar' },
  { id: 'admin', label: 'Yönetim Paneli', icon: Shield, path: '/admin', category: 'Sayfalar' },
]

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const filtered = commands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  )

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setIsOpen(prev => !prev)
      setQuery('')
      setSelectedIndex(0)
    }
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const handleSelect = (item: CommandItem) => {
    navigate(item.path)
    setIsOpen(false)
    setQuery('')
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex])
    }
  }

  if (!isOpen) return null

  return (
    <div className="cmd-overlay" onClick={() => setIsOpen(false)}>
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        <div className="cmd-input-wrapper">
          <Search size={18} />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Sayfa veya komut ara..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }}
            onKeyDown={handleInputKeyDown}
          />
          <kbd className="cmd-kbd">ESC</kbd>
        </div>
        <div className="cmd-list">
          {filtered.length === 0 ? (
            <div className="cmd-empty">Sonuç bulunamadı</div>
          ) : (
            filtered.map((item, i) => (
              <button
                key={item.id}
                className={`cmd-item ${i === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
                <span className="cmd-item-category">{item.category}</span>
              </button>
            ))
          )}
        </div>
        <div className="cmd-footer">
          <span><Command size={11} /> + K ile aç/kapat</span>
          <span>↑↓ Gezin · Enter Seç</span>
        </div>
      </div>
    </div>
  )
}
