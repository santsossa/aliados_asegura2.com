import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, X, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const SUGERENCIAS = [
  '¿Qué cubre la RC?',
  '¿Diferencia entre full y básico?',
  '¿Cubre si me roban el carro?',
  '¿Cómo funciona la comisión?',
]

export default function IAAssistant() {
  const [open, setOpen]         = useState(false)
  const [hover, setHover]       = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef(null)
  const inputRef                = useRef(null)
  const token                   = localStorage.getItem('token')
  const { user }                = useAuth()

  const nombre = user?.nombre || user?.email?.split('@')[0] || 'aliado'

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: `Hola ${nombre} 👋 cuéntame, ¿en qué te puedo ayudar hoy?` }])
      setTimeout(() => inputRef.current?.focus(), 320)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const msgCount = messages.length + (loading ? 1 : 0)
  const chatH    = Math.min(Math.max(msgCount * 68, 80), 380)

  async function enviar(texto) {
    const pregunta = (texto || input).trim()
    if (!pregunta || loading) return
    setInput('')
    const historial = [...messages, { role: 'user', content: pregunta }]
    setMessages(historial)
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/ia/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: historial }),
      })
      const data = await r.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.status === 'success' ? data.message : '⚠️ Error al responder.',
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sin conexión.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleOpen() {
    setHover(false)
    setOpen(true)
  }

  return (
    <>
      {/* ── Pill flotante (blanco + burbuja) ── */}
      <div
        onClick={handleOpen}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 300,
          display: 'flex', alignItems: 'center', flexDirection: 'row',
          cursor: 'pointer',
          opacity:   open ? 0 : 1,
          transform: open ? 'scale(0.55)' : 'scale(1)',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
          pointerEvents: open ? 'none' : 'auto',
        }}
      >
        {/* Contenedor blanco — siempre presente, se abre a la izquierda en hover */}
        <div style={{
          background: '#fff',
          borderRadius: 14,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          maxWidth: hover ? 220 : 0,
          opacity:  hover ? 1 : 0,
          paddingLeft:  hover ? 16 : 0,
          paddingRight: hover ? 14 : 0,
          paddingTop: 10, paddingBottom: 10,
          marginRight: hover ? 8 : 0,
          boxShadow: hover ? '0 2px 16px rgba(0,0,0,0.11)' : 'none',
          transition: 'max-width 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease, padding 0.2s ease, margin 0.2s ease',
        }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111', lineHeight: 1.2 }}>
            Pregúntale a Anto ✨
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: '#6d28d9', lineHeight: 1.3 }}>
            Coberturas · precios · comparaciones
          </p>
        </div>

        {/* Burbuja morada */}
        <button
          data-anto-pill
          onClick={handleOpen}
          style={{
            width: 58, height: 58, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5 0%, #2D2A7A 100%)',
            border: 'none', cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: hover
              ? '0 8px 28px rgba(45,42,122,0.55)'
              : '0 4px 18px rgba(45,42,122,0.38)',
            transform: hover ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          <Sparkles size={24} color="#fff" />
        </button>
      </div>

      {/* ── Panel de chat (se expande desde la burbuja) ── */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 299,
        width: 340, background: '#1a1a2e',
        borderRadius: 22, boxShadow: '0 16px 56px rgba(0,0,0,0.45)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transformOrigin: 'bottom right',
        transform: open ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(24px)',
        opacity:   open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'transform 0.32s cubic-bezier(0.34,1.2,0.64,1), opacity 0.22s ease',
      }}>

        {/* Header */}
        <div style={{
          padding: '14px 16px 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg,#4f46e5,#2D2A7A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Sparkles size={14} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff' }}>Anto</p>
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Asistente de Asegura2.com</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', padding: 4 }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Mensajes */}
        <div style={{
          height: chatH, minHeight: 80, maxHeight: 380,
          overflowY: 'auto', padding: '14px 14px 6px',
          transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {messages.map((m, i) => {
            const esIA = m.role === 'assistant'
            return (
              <div key={i} style={{ marginBottom: 10, display: 'flex', justifyContent: esIA ? 'flex-start' : 'flex-end' }}>
                <div style={{
                  maxWidth: '84%',
                  background: esIA ? 'rgba(255,255,255,0.08)' : '#2D2A7A',
                  color: '#fff',
                  borderRadius: esIA ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                  padding: '9px 12px', fontSize: 12.5, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                }}>
                  {m.content}
                </div>
              </div>
            )
          })}

          {/* Typing dots */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px 14px 14px 14px', padding: '10px 14px', display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <span key={i} style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', animation: `dotPulse 1.2s ease-in-out ${d}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {/* Sugerencias iniciales */}
          {messages.length === 1 && !loading && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {SUGERENCIAS.map(s => (
                <button key={s} onClick={() => enviar(s)} style={{
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 99, padding: '5px 12px', fontSize: 11,
                  color: 'rgba(255,255,255,0.75)', cursor: 'pointer', transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '10px 12px 14px', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 999, padding: '6px 6px 6px 14px',
          }}>
            <Sparkles size={13} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0, marginRight: 8 }} />
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); enviar() } }}
              placeholder="Pregúntale a Anto..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, fontFamily: 'inherit' }}
            />
            <button
              onClick={() => enviar()}
              disabled={!input.trim() || loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: input.trim() && !loading ? '#e8705a' : 'rgba(255,255,255,0.1)',
                border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
                borderRadius: 999, padding: '7px 14px',
                color: '#fff', fontSize: 12, fontWeight: 700,
                transition: 'background 0.15s', flexShrink: 0,
              }}
            >
              {loading
                ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                : <><span>Enviar</span><Send size={11} /></>
              }
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dotPulse {
          0%,80%,100% { transform:scale(0.7); opacity:0.4 }
          40%          { transform:scale(1);   opacity:1   }
        }
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
      `}</style>
    </>
  )
}
