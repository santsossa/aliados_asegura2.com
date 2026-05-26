import { useState, useRef } from 'react'
import { Sparkles, ArrowUp, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function IAAssistant() {
  const [open,  setOpen]  = useState(false)
  const [hover, setHover] = useState(false)
  const [input, setInput] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()

  function handleOpen() {
    setHover(false)
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 320)
  }

  function handleClose() {
    setOpen(false)
    setInput('')
  }

  function handleSend() {
    const q = input.trim()
    if (!q) return
    navigate('/dashboard/anto', { state: { initialMessage: q } })
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 300, display: 'flex', alignItems: 'center' }}>

      {/* Hover label — solo visible cuando está cerrada */}
      <div style={{
        background: '#fff', borderRadius: 14, overflow: 'hidden', whiteSpace: 'nowrap',
        maxWidth:     (hover && !open) ? 220 : 0,
        opacity:      (hover && !open) ? 1   : 0,
        paddingLeft:  (hover && !open) ? 16  : 0,
        paddingRight: (hover && !open) ? 14  : 0,
        paddingTop: 10, paddingBottom: 10,
        marginRight:  (hover && !open) ? 8   : 0,
        boxShadow: (hover && !open) ? '0 2px 16px rgba(0,0,0,0.11)' : 'none',
        transition: 'max-width 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease, padding 0.2s ease, margin 0.2s ease',
      }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111', lineHeight: 1.2 }}>
          Pregúntale a Anto ✨
        </p>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#6d28d9', lineHeight: 1.3 }}>
          Coberturas · precios · comparaciones
        </p>
      </div>

      {/* Elemento principal — morfea de burbuja a barra */}
      <div
        onMouseEnter={() => !open && setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={!open ? handleOpen : undefined}
        style={{
          position: 'relative',
          width:        open ? 320 : 58,
          height:       open ? 50  : 58,
          borderRadius: open ? 999 : '50%',
          background:   open
            ? '#fff'
            : 'linear-gradient(135deg, #4f46e5 0%, #2D2A7A 100%)',
          border:    open ? '1.5px solid #e5e7eb' : '1.5px solid transparent',
          boxShadow: open
            ? '0 2px 14px rgba(0,0,0,0.09)'
            : hover
              ? '0 8px 28px rgba(45,42,122,0.55)'
              : '0 4px 18px rgba(45,42,122,0.38)',
          cursor:   open ? 'default' : 'pointer',
          overflow: 'hidden',
          transform: (hover && !open) ? 'scale(1.06)' : 'scale(1)',
          transition: [
            'width 0.38s cubic-bezier(0.34,1.08,0.64,1)',
            'height 0.32s cubic-bezier(0.34,1.08,0.64,1)',
            'border-radius 0.34s ease',
            'background 0.22s ease',
            'box-shadow 0.2s ease',
            'border-color 0.2s ease',
            'transform 0.2s ease',
          ].join(', '),
        }}
      >
        {/* Icono Sparkles — visible cuando cerrada */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: open ? 0 : 1,
          transition: 'opacity 0.12s ease',
          pointerEvents: 'none',
        }}>
          <Sparkles size={24} color="#fff" />
        </div>

        {/* Input bar — visible cuando abierta */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center',
          padding: '0 6px 0 14px', gap: 6,
          opacity: open ? 1 : 0,
          transition: 'opacity 0.16s ease 0.2s',
          pointerEvents: open ? 'auto' : 'none',
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); handleSend() }
              if (e.key === 'Escape') handleClose()
            }}
            placeholder="Pregúntale a Anto..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontFamily: 'Inter', fontSize: 13.5, color: '#111827',
              background: 'transparent', minWidth: 0,
            }}
          />
          <button
            onClick={handleClose}
            style={{
              width: 24, height: 24, borderRadius: '50%', border: 'none',
              background: 'transparent', cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af',
            }}
          >
            <X size={12} />
          </button>
          <button
            onClick={handleSend}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: input.trim() ? '#2D2A7A' : '#e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() ? 'pointer' : 'default',
              transition: 'background 0.15s', flexShrink: 0,
            }}
          >
            <ArrowUp size={13} color={input.trim() ? '#fff' : '#9ca3af'} />
          </button>
        </div>
      </div>
    </div>
  )
}
