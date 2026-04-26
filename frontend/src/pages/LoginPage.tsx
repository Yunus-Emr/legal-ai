import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Scale, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error('Lütfen tüm alanları doldurun')
      return
    }
    try {
      await login(email, password)
      toast.success('Giriş başarılı!')
      navigate('/dashboard')
    } catch {
      toast.error('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.')
    }
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
          <h1 className="auth-logo-text">Legal AI</h1>
          <p className="auth-subtitle">Hukuki yapay zeka asistanınıza giriş yapın</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
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
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="auth-options">
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
              />
              <span>Beni hatırla</span>
            </label>
            <a href="#" className="auth-link">Şifremi unuttum</a>
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
                Giriş Yap
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Hesabınız yok mu?{' '}
          <Link to="/register" className="auth-link">Kayıt olun</Link>
        </div>

        <div className="auth-demo-hint">
          <span>Demo: herhangi bir e-posta ve şifre ile giriş yapabilirsiniz</span>
        </div>
      </div>
    </div>
  )
}
