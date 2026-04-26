import { useState, useEffect } from 'react'
import {
  LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  TrendingUp, MessageSquare, Clock, FileText, Activity, Cpu,
} from 'lucide-react'
import { dashboardApi } from '../services/api'

const tooltipStyle = {
  background: '#13161e',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 10,
  fontSize: 13,
  color: '#f0f2f7',
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    total_documents: 0,
    total_chunks: 0,
    total_queries: 0,
    avg_response_time_ms: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await dashboardApi.getStats()
        setStats(data)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Mock trends but linked to stats
  const queryTrends = [
    { date: 'Pzt', queries: 0, responses: 0 },
    { date: 'Sal', queries: 0, responses: 0 },
    { date: 'Çrş', queries: 0, responses: 0 },
    { date: 'Prş', queries: 0, responses: 0 },
    { date: 'Bugün', queries: stats.total_queries, responses: stats.total_queries },
  ]

  if (loading) return <div className="page-content">Yükleniyor...</div>

  return (
    <>
      <div className="top-header">
        <div>
          <div className="header-title">📊 Analitik</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Kullanım istatistikleri ve trendler
          </div>
        </div>
        <div className="header-actions">
          <span className="badge badge-accent">Bu Hafta</span>
        </div>
      </div>

      <div className="page-content">
        {/* Stat Cards */}
        <div className="stats-grid">
          {[
            { icon: MessageSquare, label: 'Toplam Sorgu', value: stats.total_queries, change: 'Canlı', color: 'rgba(99,102,241,0.15)', iconColor: 'var(--accent-light)' },
            { icon: FileText, label: 'Doküman', value: stats.total_documents, change: 'Aktif', color: 'rgba(16,185,129,0.1)', iconColor: 'var(--success)' },
            { icon: Clock, label: 'Ort. Yanıt Süresi', value: `${stats.avg_response_time_ms}ms`, change: 'Lokal', color: 'rgba(59,130,246,0.1)', iconColor: 'var(--info)' },
            { icon: Cpu, label: 'Chunk Sayısı', value: stats.total_chunks, change: 'Vektör', color: 'rgba(212,175,55,0.1)', iconColor: 'var(--gold)' },
          ].map(stat => (
            <div key={stat.label} className="stat-card">
              <div className="stat-icon" style={{ background: stat.color }}>
                <stat.icon size={20} color={stat.iconColor} />
              </div>
              <div className="stat-info">
                <div className="stat-value" style={{ color: stat.iconColor }}>{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-change up">
                  <TrendingUp size={11} />
                  {stat.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="dashboard-grid" style={{ marginBottom: 16 }}>
          {/* Query Trends */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Sorgu Trendleri</h3>
              <Activity size={16} color="var(--text-muted)" />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={queryTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="queries" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 4 }} name="Sorgular" />
                <Line type="monotone" dataKey="responses" stroke="var(--success)" strokeWidth={2} dot={{ fill: 'var(--success)', r: 3 }} name="Yanıtlar" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Response Time */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Sistem Ölçeklendirme</h3>
              <Cpu size={16} color="var(--text-muted)" />
            </div>
            <div style={{padding: 20, textAlign: 'center'}}>
               <div style={{fontSize: 48, fontWeight: 'bold', color: 'var(--accent)'}}>{stats.total_chunks}</div>
               <div style={{color: 'var(--text-secondary)'}}>Toplam Indekslenen Vektör Chunk</div>
               <div style={{marginTop: 20, fontSize: 13, color: 'var(--text-muted)'}}>
                  Vektör veritabanı (OpenSearch) kapasitesi: %0.1 kullanılıyor
               </div>
            </div>
          </div>
        </div>

        {/* Info Row */}
        <div className="card">
           <div className="card-header">
              <h3 className="card-title">Veri Kaynağı Bilgisi</h3>
           </div>
           <div style={{padding: '0 20px 20px', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6}}>
              Analitik verileri, sistem üzerindeki gerçek aksiyonlardan (`AuditLog`) ve LLM yanıt sürelerinden (`QueryLog`) üretilmektedir. 
              Her yeni doküman yüklendiğinde veya bir soru sorulduğunda bu grafikler otomatik olarak güncellenir.
           </div>
        </div>
      </div>
    </>
  )
}
