import { useState, useRef, useEffect } from 'react'
import { Sparkles, ArrowUp, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const MSG_H    = 74   // altura estimada por mensaje
const MAX_CHAT = 300  // tope del área de mensajes

export default function IAAssistant() {
  const [open,     setOpen]     = useState(false)
  const [hover,    setHover]    = useState(false)
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const inputRef  = useRef(null)
  const bottomRef = useRef(null)
  const { getToken } = useAuth()

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 340)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function enviar(texto) {
    const q = (texto ?? input).trim()
    if (!q || loading) return
    setInput('')
    const historial = [...messages, { role: 'user', content: q }]
    setMessages(historial)
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/ia/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
        body: JSON.stringify({ messages: historial }),
      })
      const data = await r.json()
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: data.status === 'success' ? data.message : '⚠️ No pude obtener respuesta.',
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sin conexión.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setInput('')
    setMessages([])
  }

  const hasContent = messages.length > 0 || loading
  const chatH      = Math.min(messages.length * MSG_H + (loading ? 54 : 0), MAX_CHAT)

  // Altura total del contenedor
  const totalH = open
    ? (hasContent ? 50 + 8 + chatH : 50)
    : 58

  // Radio del contenedor
  const radius = open
    ? (hasContent ? 20 : 999)
    : '50%'

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 300, display: 'flex', alignItems: 'flex-end' }}>

      {/* Hover label */}
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

      {/* Contenedor principal que morfea */}
      <div
        onMouseEnter={() => !open && setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={!open ? () => { setHover(false); setOpen(true) } : undefined}
        style={{
          position:     'relative',
          width:        open ? 320 : 58,
          height:       totalH,
          borderRadius: radius,
          background:   open
            ? '#fff'
            : 'linear-gradient(135deg, #4f46e5 0%, #2D2A7A 100%)',
          border:    open ? '1.5px solid #e5e7eb' : '1.5px solid transparent',
          boxShadow: open
            ? '0 4px 28px rgba(0,0,0,0.11)'
            : hover
              ? '0 8px 28px rgba(45,42,122,0.55)'
              : '0 4px 18px rgba(45,42,122,0.38)',
          cursor:        open ? 'default' : 'pointer',
          overflow:      'hidden',
          display:       'flex',
          flexDirection: 'column',
          transform:     (hover && !open) ? 'scale(1.06)' : 'scale(1)',
          transition: [
            'width 0.38s cubic-bezier(0.34,1.08,0.64,1)',
            'height 0.34s cubic-bezier(0.4,0,0.2,1)',
            'border-radius 0.32s ease',
            'background 0.22s ease',
            'box-shadow 0.2s ease',
            'transform 0.2s ease',
          ].join(', '),
        }}
      >
        {/* Ícono — visible cuando cerrada */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: open ? 0 : 1,
          transition: 'opacity 0.12s ease',
          pointerEvents: 'none',
        }}>
          <Sparkles size={24} color="#fff" />
        </div>

        {/* Área de mensajes — crece hacia arriba */}
        {open && (
          <div style={{
            flex:       1,
            overflowY:  'auto',
            padding:    hasContent ? '12px 14px 6px' : '0',
            opacity:    hasContent ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}>
            {messages.map((m, i) => {
              const esIA = m.role === 'assistant'
              return (
                <div key={i} style={{ marginBottom: 8, display: 'flex', justifyContent: esIA ? 'flex-start' : 'flex-end' }}>
                  {esIA && (
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#4f46e5,#2D2A7A)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginRight: 7, marginTop: 2,
                    }}>
                      <Sparkles size={10} color="#fff" />
                    </div>
                  )}
                  <div style={{
                    maxWidth:   '80%',
                    background: esIA ? 'transparent' : 'rgba(45,42,122,0.08)',
                    color:      esIA ? '#111827' : '#1e1b4b',
                    borderRadius: esIA ? 0 : '12px 3px 12px 12px',
                    padding:    esIA ? '0' : '7px 11px',
                    fontFamily: 'Inter', fontSize: 12.5, lineHeight: 1.65,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {m.content}
                  </div>
                </div>
              )
            })}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#2D2A7A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={10} color="#fff" />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 0.18, 0.36].map((d, j) => (
                    <span key={j} style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#9ca3af', animation: `dp 1.2s ease-in-out ${d}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Barra de input — siempre al fondo cuando está abierta */}
        {open && (
          <div style={{
            flexShrink: 0, height: 50,
            display: 'flex', alignItems: 'center',
            padding: '0 6px 0 14px', gap: 6,
            borderTop: hasContent ? '1px solid #f3f4f6' : 'none',
            opacity: 1,
            transition: 'opacity 0.16s ease 0.2s',
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter')  { e.preventDefault(); enviar() }
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
              style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}
            >
              <X size={12} />
            </button>
            <button
              onClick={() => enviar()}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: input.trim() && !loading ? '#2D2A7A' : '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                transition: 'background 0.15s', flexShrink: 0,
              }}
            >
              <ArrowUp size={13} color={input.trim() && !loading ? '#fff' : '#9ca3af'} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes dp { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  )
}
