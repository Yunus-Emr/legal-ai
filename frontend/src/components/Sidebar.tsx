import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquare,
  Upload,
  Search,
  Scale,
  FileText,
  BarChart3,
  Shield,
  LogOut,
  Sun,
  Moon,
  User,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useState, useEffect } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chat', icon: MessageSquare, label: 'Sohbet' },
  { to: '/upload', icon: Upload, label: 'Doküman Yükle' },
  { to: '/documents', icon: FileText, label: 'Dokümanlar' },
  { to: '/search', icon: Search, label: 'Arama' },
]

const analyticsItems = [
  { to: '/analytics', icon: BarChart3, label: 'Analitik' },
  { to: '/admin', icon: Shield, label: 'Yönetim' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('legal_ai_theme')
    if (saved === 'light') {
      setIsDark(false)
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('legal_ai_theme', next ? 'dark' : 'light')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Scale size={16} color="white" />
        </div>
        <span className="sidebar-logo-text">Legal AI</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Ana Menü</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}

        <div className="sidebar-section-label" style={{ marginTop: 16 }}>
          Analitik & Yönetim
        </div>
        {analyticsItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Theme Toggle */}
      <div className="sidebar-theme-toggle">
        <button className="theme-toggle-btn" onClick={toggleTheme} data-tooltip={isDark ? 'Açık Tema' : 'Koyu Tema'}>
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
          <span>{isDark ? 'Açık Tema' : 'Koyu Tema'}</span>
        </button>
      </div>

      {/* User */}
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          <User size={16} />
        </div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{user?.name || 'Kullanıcı'}</span>
          <span className="sidebar-user-email">{user?.email || ''}</span>
        </div>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={handleLogout}
          data-tooltip="Çıkış yap"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
