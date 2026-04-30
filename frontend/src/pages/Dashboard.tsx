import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from 'recharts'
import {
  FileText, MessageSquare, Cpu, Clock, TrendingUp,
  CheckCircle, AlertCircle, Upload, Search, Users, Zap,
} from 'lucide-react'
import { dashboardApi, healthApi, documentsApi, analyticsApi } from '../services/api'
import { useAuthStore } from '../store/authStore'

// Skeleton
function Skeleton({ w = '100%', h = 20 }: { w?: string | number; h?: number }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: 6 }} />
}

const tooltipStyle = {
  background: 'var(--bg-card)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 10, fontSize: 13, color: 'var(--text-primary)',
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    total_documents: 0, total_chunks: 0,
    total_queries: 0, avg_response_time_ms: 0,
  })
  const [health, setHealth] = useState({ opensearch: false, postgres: false, status: 'loading' })
  const [recentDocs, setRecentDocs] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [queryTrends, setQueryTrends] = useState<any[]>([])
  const [topDocs, setTopDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [healthR, statsR, docsR, actR, trendsR, topR] = await Promise.allSettled([
        healthApi.check(),
        dashboardApi.getStats(),
        documentsApi.list(),
        dashboardApi.getRecentActivity(),
        analyticsApi.getQueryTrends(),
        analyticsApi.getTopDocuments(),
      ])
      if (healthR.status === 'fulfilled') setHealth(healthR.value)
      else setHealth(prev => ({ ...prev, status: 'error' }))
      if (statsR.status === 'fulfilled') setStats(statsR.value)
      if (docsR.status === 'fulfilled') setRecentDocs((docsR.value as any).documents?.slice(0, 5) ?? [])
      if (actR.status === 'fulfilled') setActivities(actR.value.slice(0, 6))
      if (trendsR.status === 'fulfilled') setQueryTrends(trendsR.value.length ? trendsR.value : mockTrends)
      if (topR.status === 'fulfilled') setTopDocs(topR.value.slice(0, 5))
      setLoading(false)
    }
    fetchData()
  }, [])

  const statCards = [
    { icon: FileText,     label: 'Doküman',       value: stats.total_documents,   color: 'rgba(16,185,129,0.1)',   iconColor: 'var(--success)' },
    { icon: MessageSquare,label: 'Toplam Sorgu',  value: stats.total_queries,     color: 'rgba(99,102,241,0.15)', iconColor: 'var(--accent-light)' },
    { icon: Cpu,          label: 'Chunk',          value: stats.total_chunks,      color: 'rgba(212,175,55,0.1)', iconColor: 'var(--gold)' },
    { icon: Clock,        label: 'Ort. Yanıt',    value: `${Math.round(stats.avg_response_time_ms)}ms`, color: 'rgba(59,130,246,0.1)', iconColor: 'var(--info)' },
    { icon: Users,        label: 'Aktif Kullanıcı', value: '—',                   color: 'rgba(139,92,246,0.1)', iconColor: '#a78bfa' },
    { icon: Zap,          label: 'Sistem',         value: health.status === 'ok' ? '✓ Sağlıklı' : health.status, color: health.status === 'ok' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', iconColor: health.status === 'ok' ? 'var(--success)' : 'var(--danger)' },
  ]

  return (
    <>
      <div className="top-header">
        <div>
          <div className="header-title">
            👋 Merhaba, {user?.name?.split(' ')[0] || 'Kullanıcı'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Legal AI platformuna hoş geldiniz
          </div>
        </div>
        <div className="header-actions">
          <a href="/upload" className="btn btn-primary btn-sm">
            <Upload size={13} /> Doküman Yükle
          </a>
          <a href="/chat" className="btn btn-ghost btn-sm">
            <Search size={13} /> Sorgu Yap
          </a>
        </div>
      </div>

      <div className="page-content">
        {/* Stat Cards — 6 */}
        <div className="stats-grid-6" style={{ marginBottom: 20 }}>
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="stat-card"><Skeleton h={70} /></div>
              ))
            : statCards.map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-icon" style={{ background: s.color }}>
                    <s.icon size={18} color={s.iconColor} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-value" style={{ color: s.iconColor, fontSize: 20 }}>{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
        </div>

        {/* Main Charts Row */}
        <div className="dashboard-grid" style={{ marginBottom: 16 }}>
          {/* Query Trends Area Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Sorgu Trendleri (7 Gün)</h3>
              <TrendingUp size={16} color="var(--text-muted)" />
            </div>
            {loading ? <Skeleton h={220} /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={queryTrends}>
                  <defs>
                    <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="queries" stroke="var(--accent)" fill="url(#dashGrad)" strokeWidth={2} name="Sorgu" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top Documents */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">En Aktif Dokümanlar</h3>
              <FileText size={16} color="var(--text-muted)" />
            </div>
            {loading ? <Skeleton h={220} /> : topDocs.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topDocs} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="queries" fill="var(--accent)" radius={[0, 4, 4, 0]} name="Sorgu" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Doküman yüklenince burada görünecek.
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Recent Docs + Activity + System Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {/* Recent Documents */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Son Dokümanlar</h3>
              <span className="badge badge-accent">{recentDocs.length}</span>
            </div>
            {loading ? <div style={{ padding: 16 }}><Skeleton h={120} /></div> : (
              <div style={{ padding: '0 4px 8px' }}>
                {recentDocs.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Henüz doküman yok
                  </div>
                )}
                {recentDocs.map(doc => (
                  <div key={doc.id} className="activity-item">
                    <FileText size={14} style={{ flexShrink: 0, color: 'var(--accent-light)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.filename}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {doc.chunk_count} chunk · {doc.status}
                      </div>
                    </div>
                    <span className={`badge ${doc.status === 'indexed' ? 'badge-success' : doc.status === 'error' ? 'badge-danger' : 'badge-accent'}`} style={{ fontSize: 10 }}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Son Aktiviteler</h3>
            </div>
            {loading ? <div style={{ padding: 16 }}><Skeleton h={120} /></div> : (
              <div style={{ padding: '0 4px 8px' }}>
                {activities.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Henüz aktivite yok
                  </div>
                )}
                {activities.map((act, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-icon">{act.type === 'query' ? '🔍' : act.type === 'document_upload' ? '📤' : '⚡'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.description}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(act.timestamp).toLocaleTimeString('tr-TR')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Sistem Durumu</h3>
            </div>
            <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'PostgreSQL', ok: health.postgres },
                { label: 'OpenSearch', ok: health.opensearch },
                { label: 'API',        ok: health.status === 'ok' },
                { label: 'LLM Servisi', ok: true },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</span>
                  {s.ok
                    ? <span className="badge badge-success"><CheckCircle size={10} /> Çalışıyor</span>
                    : <span className="badge badge-danger"><AlertCircle size={10} /> Kapalı</span>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const mockTrends = ['Pzt','Sal','Çrş','Prş','Cum','Cmt','Paz'].map(d => ({ date: d, queries: 0 }))
