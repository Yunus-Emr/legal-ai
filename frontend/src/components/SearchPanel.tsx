import { useState } from 'react'
import { Search, FileText, SlidersHorizontal } from 'lucide-react'
import { searchApi } from '../services/api'
import toast from 'react-hot-toast'

interface SearchResult {
  chunk_id: string
  document_name: string
  text: string
  score: number
  page?: number
}

export default function SearchPanel() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [topK, setTopK] = useState(5)
  const [searched, setSearched] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)

  const handleSearch = async (filterOverride?: string | null) => {
    const activeFilter = filterOverride !== undefined ? filterOverride : selectedFilter
    const finalQuery = query.trim()
    if (!finalQuery && !activeFilter) return

    setLoading(true)
    setSearched(true)
    try {
      // Mock filter application: prefixing the query
      const fullQuery = activeFilter ? `[${activeFilter}] ${finalQuery}` : finalQuery
      const data = await searchApi.search(fullQuery, topK)
      setResults(data.results ?? [])
    } catch {
      toast.error('Arama başarısız oldu.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const highlight = (text: string, q: string) => {
    if (!q.trim()) return text
    const words = q.split(' ').filter(Boolean).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    if (words.length === 0) return text
    const regex = new RegExp(`(${words.join('|')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part) =>
      regex.test(part) ? `<mark>${part}</mark>` : part,
    ).join('')
  }

  return (
    <div>
      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div className="search-input-wrapper" style={{ flex: 1 }}>
          <Search size={16} />
          <input
            type="text"
            className="input"
            placeholder="Anayasa, iş hukuku, sözleşme maddeleri..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <select
          className="input"
          style={{ width: 100 }}
          value={topK}
          onChange={e => setTopK(Number(e.target.value))}
        >
          <option value={3}>Top 3</option>
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
        </select>
        <button
          className="btn btn-primary"
          onClick={() => handleSearch()}
          disabled={loading || (!query.trim() && !selectedFilter)}
        >
          {loading ? <div className="spinner" /> : <Search size={15} />}
          Ara
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <SlidersHorizontal size={14} color="var(--text-muted)" />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Filtreler:
        </span>
        {['Sözleşmeler', 'Kanunlar', 'Yönetmelikler', 'Mahkeme Kararları'].map(
          f => (
            <button 
              key={f} 
              className={`badge ${selectedFilter === f ? 'badge-accent' : 'badge-secondary'}`} 
              style={{ cursor: 'pointer', opacity: selectedFilter === f ? 1 : 0.6 }}
              onClick={() => {
                const next = selectedFilter === f ? null : f
                setSelectedFilter(next)
                if (query.trim()) handleSearch(next)
              }}
            >
              {f}
            </button>
          ),
        )}
      </div>

      {/* Results */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Search size={24} />
          </div>
          <h3 className="empty-state-title">Sonuç Bulunamadı</h3>
          <p className="empty-state-text">
            "{query}" için dokümanlarınızda eşleşme bulunamadı.
          </p>
        </div>
      )}

      {!loading &&
        results.map((res, idx) => (
          <div key={res.chunk_id ?? idx} className="search-result-item">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <div className="search-result-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={13} color="var(--accent-light)" />
                {res.document_name}
                {res.page && (
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      fontWeight: 400,
                    }}
                  >
                    · sf. {res.page}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                #{idx + 1}
              </span>
            </div>

            <p
              className="search-result-text"
              dangerouslySetInnerHTML={{
                __html: highlight(
                  res.text.length > 300 ? res.text.slice(0, 300) + '…' : res.text,
                  query,
                ),
              }}
            />

            <div className="search-score">
              <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                Benzerlik
              </span>
              <div className="score-bar">
                <div
                  className="score-fill"
                  style={{ width: `${Math.round(res.score * 100)}%` }}
                />
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--accent-light)',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {Math.round(res.score * 100)}%
              </span>
            </div>
          </div>
        ))}
    </div>
  )
}
