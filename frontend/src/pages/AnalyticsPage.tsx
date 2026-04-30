import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import {
  TrendingUp, MessageSquare, Clock, FileText, Activity,
  Cpu, Users, Zap,
} from 'lucide-react'
import { dashboardApi, analyticsApi } from '../services/api'

const tooltipStyle = {
  background: 'var(--bg-card)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 10,
  fontSize: 13,
  color: 'var(--text-primary)',
}

// Skeleton loader
function Skeleton({ w = '100%', h = 20 }: { w?: string | number; h?: number }) {
  return (
    <div
      className="skeleton"
      style={{ width: w, height: h, borderRadius: 6 }}
    />
  )
}

// Usage heatmap (day × hour)
function UsageHeatmap({ data }: { data: Array<{ day: number; hour: number; value: number }> }) {
  const days = ['Pzt', 'Sal', 'Çrş', 'Prş', 'Cum', 'Cmt', 'Paz']
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const grid: Record<string, number> = {}
  data.forEach(d => { grid[`${d.day}-${d.hour}`] = d.value })

  return (
    <div className="heatmap-grid">
      <div className="heatmap-hours">
        {[0, 3, 6, 9, 12, 15, 18, 21].map(h => (
          <span key={h} className="heatmap-label">{h}:00</span>
        ))}
      </div>
      {days.map((day, d) => (
        <div key={d} className="heatmap-row">
          <span className="heatmap-day-label">{day}</span>
          {Array.from({ length: 24 }, (_, h) => {
            const val = grid[`${d + 1}-${h}`] || 0
            const opacity = val ? 0.15 + (val / maxVal) * 0.85 : 0.05
            return (
              <div
                key={h}
                className="heatmap-cell"
                style={{ background: `rgba(99,102,241,${opacity})` }}
                title={`${day} ${h}:00 — ${val} sorgu`}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    total_documents: 0, total_chunks: 0,
    total_queries: 0, avg_response_time_ms: 0,
  })
  const [queryTrends, setQueryTrends] = useState<any[]>([])
  const [topDocs, setTopDocs] = useState<any[]>([])
  const [responseTime, setResponseTime] = useState<any[]>([])
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [stats, trends, docs, rt, hm] = await Promise.allSettled([
          dashboardApi.getStats(),
          analyticsApi.getQueryTrends(),
          analyticsApi.getTopDocuments(),
          analyticsApi.getResponseTimeDistribution(),
          analyticsApi.getHeatmap(),
        ])
        if (stats.status === 'fulfilled') setStats(stats.value)
        if (trends.status === 'fulfilled') setQueryTrends(trends.value.length ? trends.value : mockTrends)
        if (docs.status === 'fulfilled') setTopDocs(docs.value.length ? docs.value : mockDocs)
        if (rt.status === 'fulfilled') setResponseTime(rt.value.length ? rt.value : mockRT)
        if (hm.status === 'fulfilled') setHeatmapData(hm.value)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const statCards = [
    { icon: MessageSquare, label: 'Toplam Sorgu',    value: stats.total_queries,          color: 'rgba(99,102,241,0.15)', iconColor: 'var(--accent-light)' },
    { icon: FileText,     label: 'Doküman',          value: stats.total_documents,         color: 'rgba(16,185,129,0.1)',  iconColor: 'var(--success)' },
    { icon: Clock,        label: 'Ort. Yanıt',       value: `${Math.round(stats.avg_response_time_ms)}ms`, color: 'rgba(59,130,246,0.1)', iconColor: 'var(--info)' },
    { icon: Cpu,          label: 'Chunk',             value: stats.total_chunks,            color: 'rgba(212,175,55,0.1)', iconColor: 'var(--gold)' },
  ]

  return (
    <>
      <div className="top-header">
        <div>
          <div className="header-title">📊 Analitik</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Canlı kullanım istatistikleri</div>
        </div>
        <div className="header-actions">
          <span className="badge badge-accent">Gerçek Zamanlı</span>
        </div>
      </div>

      <div className="page-content">
        {/* Stat Cards */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          {loading
            ? Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="stat-card"><Skeleton h={80} /></div>
              ))
            : statCards.map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-icon" style={{ background: s.color }}>
                    <s.icon size={20} color={s.iconColor} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-value" style={{ color: s.iconColor }}>{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-change up"><TrendingUp size={11} /> Canlı</div>
                  </div>
                </div>
              ))}
        </div>

        {/* Row 1: Trends + Response Time */}
        <div className="dashboard-grid" style={{ marginBottom: 16 }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Sorgu Trendleri (7 Gün)</h3>
              <Activity size={16} color="var(--text-muted)" />
            </div>
            {loading ? <Skeleton h={240} /> : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={queryTrends}>
                  <defs>
                    <linearGradient id="qGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="queries" stroke="var(--accent)" fill="url(#qGrad)" strokeWidth={2} name="Sorgu" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Yanıt Süresi Dağılımı</h3>
              <Zap size={16} color="var(--text-muted)" />
            </div>
            {loading ? <Skeleton h={240} /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={responseTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="Sorgu Sayısı" radius={[4, 4, 0, 0]}>
                    {responseTime.map((_, i) => (
                      <Cell key={i} fill={`hsl(${240 + i * 15}, 80%, ${50 + i * 5}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Row 2: Top Docs + Heatmap */}
        <div className="dashboard-grid" style={{ marginBottom: 16 }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">En Çok Kullanılan Dokümanlar</h3>
              <FileText size={16} color="var(--text-muted)" />
            </div>
            {loading ? <Skeleton h={240} /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topDocs} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="queries" fill="var(--accent)" radius={[0, 4, 4, 0]} name="Sorgu" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Kullanım Yoğunluk Haritası</h3>
              <Users size={16} color="var(--text-muted)" />
            </div>
            {loading
              ? <Skeleton h={240} />
              : heatmapData.length > 0
                ? <div style={{ padding: '0 16px 16px' }}><UsageHeatmap data={heatmapData} /></div>
                : <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Henüz yeterli veri yok. Sorgu gönderildikçe harita dolar.
                  </div>
            }
          </div>
        </div>
      </div>
    </>
  )
}

// Mock fallbacks (when DB is empty)
const mockTrends = ['Pzt','Sal','Çrş','Prş','Cum','Cmt','Paz'].map((d, i) => ({ date: d, queries: i * 2 }))
const mockDocs = [{ name: 'Henüz doküman yok', queries: 0 }]
const mockRT = [
  { range: '0-1s', count: 0 }, { range: '1-2s', count: 0 },
  { range: '2-3s', count: 0 }, { range: '3-4s', count: 0 }, { range: '5s+', count: 0 },
]
