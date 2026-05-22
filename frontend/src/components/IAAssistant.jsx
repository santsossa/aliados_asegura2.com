import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const SUGERENCIAS = [
  '¿Qué cubre la responsabilidad civil?',
  '¿El seguro cubre si me chocan y el otro no tiene seguro?',
  '¿Qué diferencia hay entre plan full y básico?',
  '¿Cómo funciona si me roban el carro?',
]

function Burbuja({ msg }) {
  const esIA = msg.role === 'assistant'
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-start',
      flexDirection: esIA ? 'row' : 'row-reverse',
      marginBottom: 12,
    }}>
      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: esIA ? '#2D2A7A' : '#e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 2,
      }}>
        {esIA
          ? <Bot size={14} color="#fff" />
          : <User size={14} color="#6b7280" />
        }
      </div>
      {/* Texto */}
      <div style={{
        maxWidth: '78%',
        background: esIA ? '#f5f4ff' : '#2D2A7A',
        color: esIA ? '#1a1a2e' : '#fff',
        borderRadius: esIA ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
        padding: '10px 13px',
        fontSize: 13,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
      </div>
    </div>
  )
}

export default function IAAssistant() {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef(null)
  const inputRef                = useRef(null)
  const token                   = localStorage.getItem('token')

  // Bienvenida al abrir
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: '¡Hola! Soy Alia 👋, tu asistente de Asegura2.com.\n\nPuedo ayudarte a responder preguntas de tus clientes sobre coberturas, planes y seguros de autos. ¿Qué necesitas saber?',
      }])
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  // Scroll al fondo al llegar mensaje nuevo
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function enviar(texto) {
    const pregunta = (texto || input).trim()
    if (!pregunta || loading) return
    setInput('')

    const historial = [
      ...messages.filter(m => m.role !== 'system'),
      { role: 'user', content: pregunta },
    ]
    setMessages(historial)
    setLoading(true)

    try {
      const r = await fetch(`${API}/api/ia/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: historial }),
      })
      const data = await r.json()
      if (data.status === 'success') {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Hubo un error. Intenta de nuevo.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sin conexión. Intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Botón flotante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 200,
            width: 54, height: 54, borderRadius: '50%',
            background: '#2D2A7A', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(45,42,122,0.45)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(45,42,122,0.55)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(45,42,122,0.45)' }}
          title="Asistente IA"
        >
          <MessageCircle size={22} color="#fff" />
        </button>
      )}

      {/* Panel de chat */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 200,
          width: 360, height: 520,
          background: '#fff', borderRadius: 20,
          boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          // Entrada con animación
          animation: 'iaSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}>

          {/* Header */}
          <div style={{
            background: '#2D2A7A', padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot size={17} color="#fff" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff' }}>Alia</p>
                <p style={{ margin: 0, fontSize: 10, color: '#a5b4fc' }}>Asistente de Asegura2.com</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a5b4fc', display: 'flex', padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 8px' }}>
            {messages.map((m, i) => <Burbuja key={i} msg={m} />)}

            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2D2A7A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={14} color="#fff" />
                </div>
                <div style={{ background: '#f5f4ff', borderRadius: '4px 14px 14px 14px', padding: '10px 14px' }}>
                  <Loader2 size={14} color="#2D2A7A" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              </div>
            )}

            {/* Sugerencias — solo si no hay historial real */}
            {messages.length === 1 && !loading && (
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 10, color: '#9ca3af', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Preguntas frecuentes
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {SUGERENCIAS.map(s => (
                    <button key={s} onClick={() => enviar(s)}
                      style={{
                        background: '#f5f4ff', border: '1px solid #ede9fe',
                        borderRadius: 10, padding: '7px 11px',
                        fontSize: 12, color: '#2D2A7A', cursor: 'pointer',
                        textAlign: 'left', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#ede9fe'}
                      onMouseLeave={e => e.currentTarget.style.background = '#f5f4ff'}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px 14px', borderTop: '1px solid #f3f4f6', flexShrink: 0,
            display: 'flex', gap: 8, alignItems: 'flex-end',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
              placeholder="Escribe tu pregunta..."
              rows={1}
              style={{
                flex: 1, resize: 'none', border: '1.5px solid #e5e7eb',
                borderRadius: 12, padding: '9px 12px', fontSize: 13,
                fontFamily: 'inherit', outline: 'none', lineHeight: 1.5,
                maxHeight: 80, overflowY: 'auto',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#2D2A7A'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
            <button
              onClick={() => enviar()}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: input.trim() && !loading ? '#2D2A7A' : '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.15s',
              }}
            >
              <Send size={15} color={input.trim() && !loading ? '#fff' : '#9ca3af'} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes iaSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
