import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Scale, Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  const passwordChecks = [
    { label: 'En az 6 karakter', ok: password.length >= 6 },
    { label: 'Büyük harf içermeli', ok: /[A-Z]/.test(password) },
    { label: 'Rakam içermeli', ok: /\d/.test(password) },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Lütfen tüm alanları doldurun')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor')
      return
    }
    if (password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır')
      return
    }
    try {
      await register(name, email, password)
      setSuccess(true)
      toast.success('Kayıt başarılı!')
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch {
      toast.error('Kayıt başarısız. Lütfen tekrar deneyin.')
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-bg-effects">
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
        </div>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-success-icon">
            <CheckCircle size={48} color="var(--success)" />
          </div>
          <h2 style={{ marginBottom: 8 }}>Kayıt Başarılı!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Yönlendiriliyorsunuz...
          </p>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-effects">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Scale size={24} color="white" />
          </div>
          <h1 className="auth-logo-text">Hesap Oluştur</h1>
          <p className="auth-subtitle">Legal AI platformuna katılın</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Ad Soyad</label>
            <div className="auth-input-wrapper">
              <User size={16} />
              <input
                type="text"
                className="auth-input"
                placeholder="Adınız Soyadınız"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">E-posta</label>
            <div className="auth-input-wrapper">
              <Mail size={16} />
              <input
                type="email"
                className="auth-input"
                placeholder="ornek@mail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Şifre</label>
            <div className="auth-input-wrapper">
              <Lock size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="password-checks">
                {passwordChecks.map(c => (
                  <span key={c.label} className={`pw-check ${c.ok ? 'ok' : ''}`}>
                    <CheckCircle size={11} />
                    {c.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="auth-field">
            <label className="auth-label">Şifre Tekrar</label>
            <div className="auth-input-wrapper">
              <Lock size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="spinner" />
            ) : (
              <>
                Kayıt Ol
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Zaten hesabınız var mı?{' '}
          <Link to="/login" className="auth-link">Giriş yapın</Link>
        </div>
      </div>
    </div>
  )
}
