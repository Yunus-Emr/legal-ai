import { useState, useEffect } from 'react'
import {
  FileText,
  MessageSquare,
  Cpu,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Upload,
  Search,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { dashboardApi, healthApi, documentsApi } from '../services/api'

const mockChartData = [
  { day: 'Pzt', queries: 0 },
  { day: 'Sal', queries: 0 },
  { day: 'Çrş', queries: 0 },
  { day: 'Prş', queries: 0 },
  { day: 'Cum', queries: 0 },
  { day: 'Cmt', queries: 0 },
  { day: 'Paz', queries: 0 },
]

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_documents: 0,
    total_chunks: 0,
    total_queries: 0,
    avg_response_time_ms: 0,
    current_user_name: ''
  })
  const [health, setHealth] = useState({ opensearch: false, postgres: false, status: 'loading' })
  const [recentDocs, setRecentDocs] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // 1. Health check (highest priority for status display)
      try {
        const healthData = await healthApi.check()
        setHealth(healthData)
      } catch (e) {
        console.error("Health check failed:", e)
        setHealth(prev => ({ ...prev, status: 'error' }))
      }

      // 2. Stats
      try {
        const statsData = await dashboardApi.getStats()
        setStats({
          total_documents: statsData.total_documents,
          total_chunks: statsData.total_chunks,
          total_queries: statsData.total_queries,
          avg_response_time_ms: statsData.avg_response_time_ms,
          current_user_name: statsData.current_user_name || 'Kullanıcı'
        })
      } catch (e) {
        console.error("Stats fetch failed:", e)
      }

      // 3. Documents
      try {
        const docsData = await documentsApi.list()
        setRecentDocs(docsData.documents.slice(0, 5))
      } catch (e) {
        console.error("Docs list failed:", e)
      }

      // 4. Activity
      try {
        const activityData = await dashboardApi.getRecentActivity()
        setActivities(activityData)
      } catch (e) {
        console.error("Activity fetch failed:", e)
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <div className="page-content">Yükleniyor...</div>

  return (
    <>
      <div className="top-header">
        <div>
          <div className="header-title">📊 Dashboard</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Hoş geldin, {stats.current_user_name}
          </div>
        </div>
        <div className="header-actions">
          <span className={`badge ${health.status === 'ok' ? 'badge-success' : 'badge-danger'}`}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: health.status === 'ok' ? 'var(--success)' : 'var(--danger)',
                display: 'inline-block',
                marginRight: 6
              }}
            />
            {health.status === 'ok' ? 'Sistem Çalışıyor' : 'Sistem Sorunlu'}
          </span>
        </div>
      </div>

      <div className="page-content">
        {/* Stats Grid */}
        <div className="stats-grid">
          {[
            {
              icon: FileText,
              label: 'Toplam Doküman',
              value: stats.total_documents,
              change: 'Canlı',
              up: true,
              color: 'rgba(99,102,241,0.15)',
              iconColor: 'var(--accent-light)',
            },
            {
              icon: Cpu,
              label: 'Chunk Sayısı',
              value: stats.total_chunks,
              change: 'Veritabanı',
              up: true,
              color: 'rgba(16,185,129,0.1)',
              iconColor: 'var(--success)',
            },
            {
              icon: MessageSquare,
              label: 'Toplam Sorgu',
              value: stats.total_queries,
              change: 'Global',
              up: true,
              color: 'rgba(212,175,55,0.1)',
              iconColor: 'var(--gold)',
            },
            {
              icon: Clock,
              label: 'Ort. Yanıt Süresi',
              value: `${stats.avg_response_time_ms}ms`,
              change: 'Lokal LLM',
              up: true,
              color: 'rgba(59,130,246,0.1)',
              iconColor: 'var(--info)',
            },
          ].map(stat => (
            <div key={stat.label} className="stat-card">
              <div
                className="stat-icon"
                style={{ background: stat.color }}
              >
                <stat.icon size={20} color={stat.iconColor} />
              </div>
              <div className="stat-info">
                <div className="stat-value" style={{ color: stat.iconColor }}>
                  {stat.value}
                </div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-change up">
                  <TrendingUp size={11} />
                  {stat.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="dashboard-grid">
          {/* Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Sorgu Grafiği (Sistem Geneli)</h3>
              <span className="badge badge-accent">Canlı Veri</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#13161e',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    fontSize: 13,
                    color: '#f0f2f7',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="queries"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--accent)', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Sorgu"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* System Status */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Sistem Durumu</h3>
            </div>
            {[
              { label: 'FastAPI Backend', ok: true },
              { label: 'OpenSearch', ok: health.opensearch },
              { label: 'PostgreSQL', ok: health.postgres },
              { label: 'Embedding Model', ok: true },
              { label: 'LLM Service (Lokal)', ok: true },
            ].map(svc => (
              <div
                key={svc.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  {svc.label}
                </span>
                {svc.ok ? (
                  <span className="badge badge-success">
                    <CheckCircle size={11} /> OKY
                  </span>
                ) : (
                  <span className="badge badge-danger">
                    <AlertCircle size={11} /> Hata
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Docs + Activity */}
        <div className="dashboard-grid" style={{ marginTop: 16 }}>
          {/* Recent Documents */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Son Dokümanlar</h3>
              <a href="/upload" style={{ fontSize: 13, color: 'var(--accent-light)' }}>
                + Tümünü Gör
              </a>
            </div>
            {recentDocs.length === 0 && <div style={{padding: 20, textAlign: 'center', color: 'var(--text-muted)'}}>Henüz doküman yok</div>}
            {recentDocs.map(doc => (
              <div key={doc.id} className="doc-item">
                <div className="doc-icon">
                  <FileText size={16} />
                </div>
                <div className="doc-info">
                  <div className="doc-name">{doc.filename}</div>
                  <div className="doc-meta">
                    <span>{doc.chunk_count} chunk</span>
                  </div>
                </div>
                <span
                  className={`badge ${doc.status === 'indexed' ? 'badge-success' : 'badge-warning'}`}
                >
                  {doc.status === 'indexed' ? 'İndekslendi' : 'İşleniyor'}
                </span>
              </div>
            ))}
          </div>

          {/* Activity Feed */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Son Aktiviteler</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {activities.length === 0 && <div style={{padding: 20, textAlign: 'center', color: 'var(--text-muted)'}}>Aktivite yok</div>}
              {activities.map((act, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: `var(--accent)20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <ActivityIcon type={act.type} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                      {act.description}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(act.timestamp).toLocaleString('tr-TR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function ActivityIcon({ type }: { type: string }) {
  if (type === 'document_upload') return <Upload size={14} color="var(--accent)" />
  if (type === 'query') return <Search size={14} color="var(--success)" />
  return <MessageSquare size={14} color="var(--info)" />
}
