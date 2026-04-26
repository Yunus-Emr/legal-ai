import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload, FileText, X, CheckCircle, AlertCircle, Loader,
  File, FileCode, FileType,
} from 'lucide-react'
import { documentsApi } from '../services/api'
import toast from 'react-hot-toast'

interface UploadedFile {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

const fileTypeConfig: Record<string, { icon: typeof FileText; color: string; bg: string; label: string }> = {
  'application/pdf': { icon: FileText, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'PDF' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: File, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: 'DOCX' },
  'text/plain': { icon: FileType, color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'TXT' },
  'text/html': { icon: FileCode, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'HTML' },
}

const getFileConfig = (file: File) => {
  const config = fileTypeConfig[file.type]
  if (config) return config
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return fileTypeConfig['application/pdf']
  if (ext === 'docx') return fileTypeConfig['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (ext === 'txt') return fileTypeConfig['text/plain']
  if (ext === 'html' || ext === 'htm') return fileTypeConfig['text/html']
  return { icon: FileText, color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'FILE' }
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles = accepted.map(f => ({
      file: f,
      status: 'pending' as const,
      progress: 0,
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/html': ['.html', '.htm'],
    },
    multiple: true,
  })

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const uploadAll = async () => {
    const pending = files.filter(f => f.status === 'pending')
    if (!pending.length) return

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue

      setFiles(prev =>
        prev.map((f, fi) => fi === i ? { ...f, status: 'uploading' } : f),
      )

      try {
        await documentsApi.upload([files[i].file], pct => {
          setFiles(prev =>
            prev.map((f, fi) => fi === i ? { ...f, progress: pct } : f),
          )
        })
        setFiles(prev =>
          prev.map((f, fi) =>
            fi === i ? { ...f, status: 'success', progress: 100 } : f,
          ),
        )
        toast.success(`${files[i].file.name} yüklendi`)
      } catch {
        setFiles(prev =>
          prev.map((f, fi) =>
            fi === i
              ? { ...f, status: 'error', error: 'Yükleme başarısız' }
              : f,
          ),
        )
        toast.error(`${files[i].file.name} yüklenemedi`)
      }
    }
  }

  const formatBytes = (b: number) => {
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / (1024 * 1024)).toFixed(1)} MB`
  }

  const pendingCount = files.filter(f => f.status === 'pending').length

  return (
    <>
      <div className="top-header">
        <div>
          <div className="header-title">📤 Doküman Yükle</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            PDF, DOCX, TXT ve HTML dokümanlarınızı sisteme ekleyin
          </div>
        </div>
        <div className="header-actions">
          {pendingCount > 0 && (
            <button className="btn btn-primary" onClick={uploadAll}>
              <Upload size={15} />
              {pendingCount} Dosyayı Yükle
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`upload-zone${isDragActive ? ' drag-over' : ''}`}
          style={{ marginBottom: 24 }}
        >
          <input {...getInputProps()} />
          <div className="upload-icon">
            <Upload size={28} color="var(--accent-light)" />
          </div>
          <h2 className="upload-title">
            {isDragActive
              ? 'Dosyaları Bırakın'
              : 'Dosyalarınızı Sürükleyin'}
          </h2>
          <p className="upload-subtitle" style={{ marginBottom: 16 }}>
            veya dosya seçmek için tıklayın
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'PDF', color: '#ef4444' },
              { label: 'DOCX', color: '#3b82f6' },
              { label: 'TXT', color: '#10b981' },
              { label: 'HTML', color: '#f59e0b' },
            ].map(fmt => (
              <span
                key={fmt.label}
                className="badge"
                style={{
                  background: `${fmt.color}15`,
                  color: fmt.color,
                  border: `1px solid ${fmt.color}30`,
                }}
              >
                {fmt.label}
              </span>
            ))}
            <span className="badge badge-accent">Maksimum 50 MB</span>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                Yüklenecek Dosyalar ({files.length})
              </h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setFiles([])}
              >
                Tümünü Temizle
              </button>
            </div>

            {files.map((f, i) => {
              const fc = getFileConfig(f.file)
              const Icon = fc.icon
              return (
                <div key={i} className="doc-item">
                  <div
                    className="doc-icon"
                    style={{ background: fc.bg, borderColor: `${fc.color}30`, color: fc.color }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="doc-info">
                    <div className="doc-name">{f.file.name}</div>
                    <div className="doc-meta">
                      <span className="badge" style={{
                        background: `${fc.color}15`,
                        color: fc.color,
                        border: `1px solid ${fc.color}30`,
                        fontSize: 10,
                        padding: '1px 6px',
                      }}>
                        {fc.label}
                      </span>
                      <span>{formatBytes(f.file.size)}</span>
                      {f.status === 'uploading' && (
                        <>
                          <span>·</span>
                          <div
                            className="progress-bar"
                            style={{ flex: 1, maxWidth: 120 }}
                          >
                            <div
                              className="progress-fill"
                              style={{ width: `${f.progress}%` }}
                            />
                          </div>
                          <span>{f.progress}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="doc-actions">
                    {f.status === 'pending' && (
                      <span className="badge badge-warning">Bekliyor</span>
                    )}
                    {f.status === 'uploading' && (
                      <Loader size={16} className="spinner" color="var(--accent)" />
                    )}
                    {f.status === 'success' && (
                      <CheckCircle size={18} color="var(--success)" />
                    )}
                    {f.status === 'error' && (
                      <AlertCircle size={18} color="var(--danger)" />
                    )}
                    {f.status !== 'uploading' && (
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => removeFile(i)}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {files.length === 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              marginTop: 8,
            }}
          >
            {[
              { emoji: '📋', title: 'Sözleşmeler', desc: 'PDF formatında hukuki sözleşmeler', formats: ['PDF'] },
              { emoji: '⚖️', title: 'Kanun Metinleri', desc: 'Word yada PDF mevzuat dosyaları', formats: ['PDF', 'DOCX'] },
              { emoji: '📜', title: 'Mahkeme Kararları', desc: 'Yargıtay ve Danıştay kararları', formats: ['PDF', 'TXT'] },
              { emoji: '🌐', title: 'Web İçerikleri', desc: 'HTML formatında hukuki kaynaklar', formats: ['HTML'] },
            ].map(c => (
              <div key={c.title} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{c.emoji}</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {c.desc}
                </div>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                  {c.formats.map(f => (
                    <span key={f} className="badge badge-accent" style={{ fontSize: 10 }}>{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
