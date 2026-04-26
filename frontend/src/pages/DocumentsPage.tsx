import { useState, useEffect } from 'react'
import {
  FileText,
  Search,
  Grid3X3,
  List,
  Trash2,
  RefreshCw,
  Eye,
  Download,
  Filter,
  File,
  FileCode,
  FileType,
} from 'lucide-react'
import { documentsApi } from '../services/api'

interface Document {
  id: string
  filename: string
  size_bytes: number
  chunk_count: number
  status: 'indexed' | 'processing' | 'error'
  created_at: string
  file_type: 'pdf' | 'docx' | 'txt' | 'html'
}

const typeIcons: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  pdf: { icon: FileText, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  docx: { icon: File, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  txt: { icon: FileType, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  html: { icon: FileCode, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchDocs = async () => {
    try {
      const data = await documentsApi.list()
      // Map extensions from filenames
      const mapped = data.documents.map((d: any) => ({
        ...d,
        file_type: d.filename.split('.').pop()?.toLowerCase() || 'pdf'
      }))
      setDocs(mapped)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocs()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Bu dokümanı silmek istediğinize emin misiniz?")) return
    try {
      await documentsApi.delete(id)
      setDocs(prev => prev.filter(d => d.id !== id))
    } catch (err) {
      alert("Silme hatası!")
    }
  }

  const filtered = docs.filter(d => {
    const matchSearch = d.filename.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    return matchSearch && matchStatus
  })

  const formatBytes = (b: number) => {
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / (1024 * 1024)).toFixed(1)} MB`
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { class: string; label: string }> = {
      indexed: { class: 'badge-success', label: 'İndekslendi' },
      processing: { class: 'badge-warning', label: 'İşleniyor' },
      error: { class: 'badge-danger', label: 'Hata' },
    }
    const s = map[status] || map.error
    return <span className={`badge ${s.class}`}>{s.label}</span>
  }

  if (loading) return <div className="page-content">Yükleniyor...</div>

  return (
    <>
      <div className="top-header">
        <div>
          <div className="header-title">📁 Dokümanlar</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Tüm yüklenen dokümanları yönetin
          </div>
        </div>
        <div className="header-actions">
          <span className="badge badge-accent">{docs.length} doküman</span>
        </div>
      </div>

      <div className="page-content">
        {/* Toolbar */}
        <div className="docs-toolbar">
          <div className="docs-search-wrapper">
            <Search size={15} />
            <input
              type="text"
              className="input"
              placeholder="Doküman ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
          <div className="docs-toolbar-actions">
            <div className="docs-filter">
              <Filter size={14} />
              <select
                className="input"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ width: 140 }}
              >
                <option value="all">Tüm Durumlar</option>
                <option value="indexed">İndekslendi</option>
                <option value="processing">İşleniyor</option>
                <option value="error">Hata</option>
              </select>
            </div>
            <div className="docs-view-toggle">
              <button
                className={`btn btn-ghost btn-icon btn-sm ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={15} />
              </button>
              <button
                className={`btn btn-ghost btn-icon btn-sm ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* List View */}
        {viewMode === 'list' && (
          <div className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Dosya</th>
                  <th>Tür</th>
                  <th>Boyut</th>
                  <th>Chunk</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => {
                  const ti = typeIcons[doc.file_type] || typeIcons.pdf
                  const Icon = ti.icon
                  return (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 'var(--radius-md)',
                              background: ti.bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Icon size={16} color={ti.color} />
                          </div>
                          <span className="doc-table-name">{doc.filename}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-accent" style={{ textTransform: 'uppercase' }}>
                          {doc.file_type}
                        </span>
                      </td>
                      <td>{formatBytes(doc.size_bytes)}</td>
                      <td>{doc.chunk_count}</td>
                      <td>{statusBadge(doc.status)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{new Date(doc.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" data-tooltip="Görüntüle">
                            <Eye size={14} />
                          </button>
                          <button className="btn btn-ghost btn-icon btn-sm" data-tooltip="Yeniden İndeksle" onClick={fetchDocs}>
                            <RefreshCw size={14} />
                          </button>
                          <a 
                            href={`/api/v1/documents/${doc.id}/download`} 
                            target="_blank" 
                            className="btn btn-ghost btn-icon btn-sm" 
                            data-tooltip="İndir"
                          >
                            <Download size={14} />
                          </a>
                          <button className="btn btn-ghost btn-icon btn-sm" data-tooltip="Sil" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(doc.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="docs-grid">
            {filtered.map(doc => {
              const ti = typeIcons[doc.file_type] || typeIcons.pdf
              const Icon = ti.icon
              return (
                <div key={doc.id} className="docs-grid-card">
                  <div className="docs-grid-card-icon" style={{ background: ti.bg }}>
                    <Icon size={24} color={ti.color} />
                  </div>
                  <div className="docs-grid-card-name">{doc.filename}</div>
                  <div className="docs-grid-card-meta">
                    <span>{formatBytes(doc.size_bytes)}</span>
                    <span>·</span>
                    <span>{doc.chunk_count} chunk</span>
                  </div>
                  <div style={{ marginTop: 8 }}>{statusBadge(doc.status)}</div>
                  <div className="docs-grid-card-actions">
                    <button className="btn btn-ghost btn-icon btn-sm" data-tooltip="Görüntüle">
                      <Eye size={14} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" data-tooltip="Sil" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(doc.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
