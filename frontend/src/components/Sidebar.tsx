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
  LogIn,
  UserPlus,
  Lock,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useState, useEffect } from 'react'

// Always visible
const publicNavItems = [
  { to: '/chat',   icon: MessageSquare, label: 'Sohbet' },
  { to: '/search', icon: Search,        label: 'Arama' },
]

// Only for authenticated users
const authNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload',    icon: Upload,           label: 'Doküman Yükle' },
  { to: '/documents', icon: FileText,         label: 'Dokümanlar' },
]

const analyticsItems = [
  { to: '/analytics', icon: BarChart3, label: 'Analitik' },
  { to: '/admin',     icon: Shield,    label: 'Yönetim' },
]

export default function Sidebar() {
  const { user, logout, isAuthenticated } = useAuthStore()
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
    navigate('/chat')
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

        {/* Public items — always shown */}
        {publicNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}

        {/* Auth-only items — shown with lock icon for guests */}
        {authNavItems.map(({ to, icon: Icon, label }) =>
          isAuthenticated ? (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ) : (
            <div key={to} className="nav-item nav-item-locked" title="Giriş yapman gerekiyor">
              <Icon size={17} style={{ opacity: 0.4 }} />
              <span style={{ opacity: 0.4 }}>{label}</span>
              <Lock size={11} style={{ marginLeft: 'auto', opacity: 0.4 }} />
            </div>
          )
        )}

        {/* Admin items — only for authenticated */}
        {isAuthenticated && (
          <>
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
          </>
        )}
      </nav>

      {/* Theme Toggle */}
      <div className="sidebar-theme-toggle">
        <button className="theme-toggle-btn" onClick={toggleTheme} data-tooltip={isDark ? 'Açık Tema' : 'Koyu Tema'}>
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
          <span>{isDark ? 'Açık Tema' : 'Koyu Tema'}</span>
        </button>
      </div>

      {/* User / Guest section */}
      {isAuthenticated ? (
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
      ) : (
        <div className="sidebar-guest-banner">
          <p className="sidebar-guest-text">
            Oturumlarını kaydetmek ve doküman yüklemek için giriş yap.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => navigate('/login')}>
              <LogIn size={13} />
              Giriş Yap
            </button>
            <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => navigate('/register')}>
              <UserPlus size={13} />
              Kayıt Ol
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

