import { useState, useEffect } from 'react'
import {
  Users, Shield, Settings, Key, Cpu, Database,
  Search, ChevronDown, ChevronRight, Edit3, Trash2,
  ToggleLeft, ToggleRight, Save, AlertCircle, CheckCircle,
} from 'lucide-react'
import { adminApi } from '../services/api'

interface UserRow {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  isActive: boolean
  created_at: string
}

const configSections = [
  {
    title: 'Sistem Parametreleri',
    icon: Settings,
    items: [
      { key: 'max_docs', label: 'Maks. Doküman', value: 1000, type: 'number', icon: Database },
      { key: 'chunk_size', label: 'Parça Boyutu', value: 512, type: 'number', icon: Cpu },
    ]
  },
  {
    title: 'Model Ayarları',
    icon: Cpu,
    items: [
      { key: 'llm_temp', label: 'LLM Sıcaklığı', value: 0.7, type: 'number', icon: Settings },
      { key: 'top_k', label: 'Top-K Arama', value: 5, type: 'number', icon: Search },
    ]
  }
]

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0, 1]))

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await adminApi.getUsers()
        setUsers(data)
      } catch (e) {
        console.error("Failed to fetch users", e)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const toggleSection = (i: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <>
      <div className="top-header">
        <div>
          <div className="header-title">🛡️ Yönetim Paneli</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Kullanıcı yönetimi ve sistem ayarları
          </div>
        </div>
        <div className="header-actions">
          <span className="badge badge-gold">
            <Shield size={11} />
            Admin
          </span>
        </div>
      </div>

      <div className="page-content">
        {/* Users Section */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} />
              Kullanıcı Yönetimi
            </h3>
            <span className="badge badge-accent">{users.length} kullanıcı</span>
          </div>

          <div className="admin-search" style={{ marginBottom: 16 }}>
            <div className="search-input-wrapper" style={{ maxWidth: 320 }}>
              <Search size={15} />
              <input
                type="text"
                className="input"
                placeholder="Kullanıcı ara..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Kullanıcı</th>
                  <th>Rol</th>
                  <th>Durum</th>
                  <th>Son Aktivite</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="admin-user-avatar">
                          {u.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-gold' : 'badge-accent'}`}>
                        {u.role === 'admin' ? (
                          <><Shield size={10} /> Admin</>
                        ) : (
                          'User'
                        )}
                      </span>
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="badge badge-success"><CheckCircle size={10} /> Aktif</span>
                      ) : (
                        <span className="badge badge-danger"><AlertCircle size={10} /> İnaktif</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" data-tooltip="Düzenle">
                          <Edit3 size={14} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" data-tooltip={u.isActive ? 'Devre Dışı Bırak' : 'Aktifleştir'}>
                          {u.isActive ? <ToggleRight size={16} color="var(--success)" /> : <ToggleLeft size={16} />}
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" data-tooltip="Sil" style={{ color: 'var(--danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Config Section */}
        <div className="admin-config-grid">
          {configSections.map((section, si) => (
            <div key={si} className="card">
              <button
                className="admin-config-header"
                onClick={() => toggleSection(si)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <section.icon size={16} color="var(--accent-light)" />
                  <h3 className="card-title">{section.title}</h3>
                </div>
                {expandedSections.has(si) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {expandedSections.has(si) && (
                <div className="admin-config-body">
                  {section.items.map(item => (
                    <div key={item.key} className="admin-config-item">
                      <label className="admin-config-label">
                        <item.icon size={13} />
                        {item.label}
                      </label>
                      <input
                        type={item.type === 'number' ? 'number' : 'text'}
                        className="input"
                        defaultValue={item.value}
                        style={{ maxWidth: 200 }}
                      />
                    </div>
                  ))}
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                    <Save size={13} />
                    Kaydet
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* API Keys */}
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key size={16} />
              API Anahtarları
            </h3>
          </div>
          <div className="admin-api-keys">
            {[
              { name: 'OpenAI API Key', value: 'sk-...8f2d', status: 'active' },
              { name: 'HuggingFace Token', value: 'hf_...q3xN', status: 'active' },
            ].map(apiKey => (
              <div key={apiKey.name} className="admin-api-key-row">
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 2 }}>{apiKey.name}</div>
                  <code style={{ fontSize: 12, color: 'var(--text-muted)' }}>{apiKey.value}</code>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge badge-success">Aktif</span>
                  <button className="btn btn-ghost btn-sm">Değiştir</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
