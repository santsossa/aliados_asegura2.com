import { useState } from 'react'

const ChevronIcon = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2D2A7A"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

/**
 * Dropdown con búsqueda — mismo estilo que front-a2
 * @param {{ options: {v:string, label:string}[], value: string, onChange: (v:string)=>void, placeholder?: string }} props
 */
export default function ComboBox({ options, value, onChange, placeholder = 'Selecciona...' }) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')

  const selected = options.find(o => String(o.v) === String(value))

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options.slice(0, 120)

  function handleSelect(opt) {
    onChange(opt.v)
    setOpen(false)
    setQuery('')
  }

  const displayValue = open ? query : (selected?.label || '')

  const inputStyle = {
    width: '100%',
    padding: '10px 36px 10px 14px',
    border: `1.5px solid ${open ? '#2D2A7A' : '#e5e7eb'}`,
    borderRadius: 10,
    fontSize: 14,
    color: '#111827',
    background: '#fff',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Trigger row */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          value={displayValue}
          placeholder={placeholder}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setQuery(''); setOpen(true) }}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          autoComplete="off"
          spellCheck={false}
          style={inputStyle}
        />
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: open ? '#2D2A7A' : '#9ca3af', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
          <ChevronIcon open={open} />
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', zIndex: 300, top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          boxShadow: '0 2px 8px rgba(45,42,122,0.08), 0 8px 24px rgba(45,42,122,0.10)',
          maxHeight: 224, overflowY: 'auto',
        }}>
          {filtered.length > 0 ? filtered.map((opt, i) => {
            const isSelected = String(opt.v) === String(value)
            return (
              <div key={i} onMouseDown={() => handleSelect(opt)}
                style={{
                  padding: '9px 14px', fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  background: isSelected ? 'rgba(45,42,122,0.07)' : 'transparent',
                  color: isSelected ? '#2D2A7A' : '#111827',
                  fontWeight: isSelected ? 600 : 400,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(45,42,122,0.05)' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                <span>{opt.label}</span>
                {isSelected && <CheckIcon />}
              </div>
            )
          }) : (
            <div style={{ padding: '10px 14px', fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>Sin resultados</div>
          )}
          {!query && options.length > 120 && (
            <div style={{ padding: '6px 14px', fontSize: 12, color: '#9ca3af', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
              Escribe para filtrar más opciones
            </div>
          )}
        </div>
      )}
    </div>
  )
}
