import { useState } from 'react'
import { FileText, ChevronDown, ChevronRight, X, Download, ZoomIn, ZoomOut } from 'lucide-react'

interface Section {
  title: string
  content: string
  page: number
}

interface DocumentViewerProps {
  documentId?: string
  documentName?: string
  sections?: Section[]
  onClose?: () => void
}

const mockSections: Section[] = [
  {
    title: 'Madde 1 - Taraflar',
    page: 1,
    content:
      'İşbu sözleşme, bir tarafta ... adresinde mukim ... (bundan böyle "Birinci Taraf" olarak anılacak) ile diğer tarafta ... adresinde mukim ... (bundan böyle "İkinci Taraf" olarak anılacak) arasında imzalanmıştır.',
  },
  {
    title: 'Madde 2 - Sözleşmenin Konusu',
    page: 2,
    content:
      'İşbu sözleşme, Birinci Taraf\'ın İkinci Taraf\'a sunacağı hizmetlerin kapsamını, koşullarını ve tarafların karşılıklı hak ve yükümlülüklerini belirlemek amacıyla düzenlenmiştir.',
  },
  {
    title: 'Madde 3 - Ücret ve Ödeme',
    page: 3,
    content:
      'Hizmet bedeli olarak aylık ... TL ödenecektir. Ödemeler her ayın ilk iş gününde yapılacaktır. Geç ödemelerde aylık %2 gecikme faizi uygulanacaktır.',
  },
  {
    title: 'Madde 4 - Gizlilik',
    page: 4,
    content:
      'Taraflar, işbu sözleşme kapsamında edindikleri tüm bilgi ve belgeleri gizli tutmakla yükümlüdür. Bu yükümlülük sözleşmenin sona ermesinden itibaren 3 yıl boyunca geçerliliğini korur.',
  },
  {
    title: 'Madde 5 - Sözleşmenin Feshi',
    page: 5,
    content:
      'Taraflardan herhangi biri, 30 gün önceden yazılı bildirimde bulunmak kaydıyla işbu sözleşmeyi feshedebilir. Haklı nedenin varlığı halinde bildirim süresi aranmadan fesih mümkündür.',
  },
]

export default function DocumentViewer({
  documentId,
  documentName = 'Hizmet Sözleşmesi.pdf',
  sections = mockSections,
  onClose,
}: DocumentViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([0]),
  )
  const [zoom, setZoom] = useState(100)

  const handleDownload = () => {
    if (!documentId) return
    const token = localStorage.getItem('legal_ai_token')
    fetch(`/api/v1/documents/${documentId}/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = documentName
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    }).catch(e => console.error("Download failed:", e))
  }

  const toggleSection = (i: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)',
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
          }}
        >
          <FileText size={16} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{documentName}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {sections.length} bölüm
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => setZoom(z => Math.max(70, z - 10))}
            data-tooltip="Küçült"
          >
            <ZoomOut size={14} />
          </button>
          <span
            style={{ fontSize: 12, color: 'var(--text-secondary)', alignSelf: 'center' }}
          >
            {zoom}%
          </span>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => setZoom(z => Math.min(150, z + 10))}
            data-tooltip="Büyüt"
          >
            <ZoomIn size={14} />
          </button>
          <button className="btn btn-ghost btn-icon btn-sm" data-tooltip="İndir" onClick={handleDownload}>
            <Download size={14} />
          </button>
          {onClose && (
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 20,
          fontSize: zoom / 100 + 'em',
        }}
      >
        {sections.map((sec, i) => (
          <div
            key={i}
            style={{
              marginBottom: 8,
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e =>
              (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')
            }
            onMouseLeave={e =>
              (e.currentTarget.style.borderColor = 'var(--border)')
            }
          >
            <button
              onClick={() => toggleSection(i)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                background: 'var(--bg-card)',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontSize: 'inherit',
                textAlign: 'left',
              }}
            >
              {expandedSections.has(i) ? (
                <ChevronDown size={14} color="var(--text-muted)" />
              ) : (
                <ChevronRight size={14} color="var(--text-muted)" />
              )}
              <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9em' }}>
                {sec.title}
              </span>
              <span
                style={{
                  fontSize: '0.75em',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-tertiary)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                sf. {sec.page}
              </span>
            </button>

            {expandedSections.has(i) && (
              <div
                style={{
                  padding: '14px 16px',
                  fontSize: '0.88em',
                  lineHeight: 1.8,
                  color: 'var(--text-secondary)',
                  borderTop: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                }}
              >
                {sec.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
