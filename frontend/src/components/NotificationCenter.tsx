import { useState, useRef, useEffect } from 'react'
import {
  Bell, X, CheckCircle, AlertCircle, Info,
} from 'lucide-react'

interface Notification {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  description: string
  time: string
  read: boolean
}

const mockNotifications: Notification[] = [
  { id: '1', type: 'success', title: 'Doküman yüklendi', description: 'Kira_Sozlesmesi_2024.pdf başarıyla indekslendi', time: '2 dk önce', read: false },
  { id: '2', type: 'info', title: 'Yeni özellik', description: 'Çoklu dosya formatı desteği eklendi', time: '1 sa önce', read: false },
  { id: '3', type: 'warning', title: 'İşlem devam ediyor', description: 'Ticaret_Kanunu.pdf hala indeksleniyor', time: '2 sa önce', read: true },
  { id: '4', type: 'success', title: 'Sorgu tamamlandı', description: 'Sözleşme fesih koşulları analiz edildi', time: '3 sa önce', read: true },
  { id: '5', type: 'error', title: 'Yükleme hatası', description: 'Mevzuat_Ozeti.html işlenemedi', time: '1 gün önce', read: true },
]

const typeConfig = {
  success: { icon: CheckCircle, color: 'var(--success)', bg: 'rgba(16,185,129,0.1)' },
  info: { icon: Info, color: 'var(--info)', bg: 'rgba(59,130,246,0.1)' },
  warning: { icon: AlertCircle, color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)' },
  error: { icon: AlertCircle, color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' },
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(mockNotifications)
  const panelRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="notification-center" ref={panelRef}>
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        data-tooltip="Bildirimler"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Bildirimler</h4>
            {unreadCount > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={20} />
                <span>Bildirim yok</span>
              </div>
            ) : (
              notifications.map(n => {
                const config = typeConfig[n.type]
                const Icon = config.icon
                return (
                  <div
                    key={n.id}
                    className={`notification-item ${!n.read ? 'unread' : ''}`}
                  >
                    <div
                      className="notification-icon"
                      style={{ background: config.bg }}
                    >
                      <Icon size={14} color={config.color} />
                    </div>
                    <div className="notification-body">
                      <div className="notification-title">{n.title}</div>
                      <div className="notification-desc">{n.description}</div>
                      <div className="notification-time">{n.time}</div>
                    </div>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => removeNotification(n.id)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
