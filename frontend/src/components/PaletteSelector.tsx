import { useState, useEffect } from 'react'
import { Palette, Check } from 'lucide-react'

const PALETTES = [
  { id: 'default', name: 'İndigo (Varsayılan)', color: '#6366f1' },
  { id: 'ocean', name: 'Okyanus (Mavi)', color: '#3b82f6' },
  { id: 'emerald', name: 'Zümrüt (Yeşil)', color: '#10b981' },
  { id: 'ruby', name: 'Yakut (Kırmızı)', color: '#e11d48' },
  { id: 'sunset', name: 'Günbatımı (Turuncu)', color: '#ea580c' },
  { id: 'amethyst', name: 'Ametist (Mor)', color: '#9333ea' },
  { id: 'midnight', name: 'Geceyarısı (Slate)', color: '#475569' },
  { id: 'cyberpunk', name: 'Siberpunk (Pembe)', color: '#ec4899' },
  { id: 'amber', name: 'Kehribar (Sarı)', color: '#d97706' },
  { id: 'forest', name: 'Orman (Turkuaz)', color: '#0d9488' }
]

export default function PaletteSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [active, setActive] = useState('default')

  useEffect(() => {
    const saved = localStorage.getItem('legal-ai-palette') || 'default'
    setActive(saved)
    if (saved !== 'default') {
      document.documentElement.setAttribute('data-palette', saved)
    } else {
      document.documentElement.removeAttribute('data-palette')
    }
  }, [])

  const handleSelect = (id: string) => {
    setActive(id)
    localStorage.setItem('legal-ai-palette', id)
    if (id !== 'default') {
      document.documentElement.setAttribute('data-palette', id)
    } else {
      document.documentElement.removeAttribute('data-palette')
    }
  }

  return (
    <div className="palette-selector-container">
      <button 
        className="palette-btn" 
        onClick={() => setIsOpen(!isOpen)}
        data-tooltip="Tema Rengi"
      >
        <Palette size={20} />
      </button>

      {isOpen && (
        <div className="palette-dropdown">
          <div className="palette-header">
            <h4>Renk Paleti Seçimi</h4>
            <span>(Geçici)</span>
          </div>
          <div className="palette-grid">
            {PALETTES.map(p => (
              <button
                key={p.id}
                className={`palette-circle ${active === p.id ? 'active' : ''}`}
                style={{ background: p.color }}
                onClick={() => handleSelect(p.id)}
                title={p.name}
              >
                {active === p.id && <Check size={14} color="#fff" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
