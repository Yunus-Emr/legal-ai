import SearchPanel from '../components/SearchPanel'

export default function SearchPage() {
  return (
    <>
      <div className="top-header">
        <div>
          <div className="header-title">🔍 Semantik Arama</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Dokümanlarınız üzerinde anlam tabanlı vektör araması
          </div>
        </div>
      </div>
      <div className="page-content">
        <SearchPanel />
      </div>
    </>
  )
}
