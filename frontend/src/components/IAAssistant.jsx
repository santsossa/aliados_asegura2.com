import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, MessageCircleMore, X } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const SUGERENCIAS = [
  '¿Qué cubre la RC?',
  '¿Full vs básico?',
  '¿Cubre si me roban?',
  '¿Cómo gano comisión?',
]

export default function IAAssistant() {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef(null)
  const inputRef                = useRef(null)
  const token                   = localStorage.getItem('token')

  // Bienvenida al abrir por primera vez
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: '¡Hola! Soy Anto ✨\nPregúntame lo que quieras sobre seguros, coberturas o cómo usar la plataforma.',
      }])
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  // Scroll suave al fondo
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function enviar(texto) {
    const pregunta = (texto || input).trim()
    if (!pregunta || loading) return
    setInput('')

    const historial = [
      ...messages,
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
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.status === 'success' ? data.message : '⚠️ Error al responder.' },
      ])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sin conexión.' }])
    } finally {
      setLoading(false)
    }
  }

  // Altura dinámica: crece con los mensajes hasta un máximo
  const msgCount = messages.length + (loading ? 1 : 0)
  // Mínimo si solo está el saludo, máximo 460px
  const chatH = Math.min(Math.max(msgCount * 72, 100), 460)

  return (
    <>
      {/* Botón — pill que abraza el círculo con margen mínimo */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'fixed', bottom: 28, right: 24, zIndex: 300,
          display: 'flex', alignItems: 'center', gap: 12,
          background: '#f5f5f7', border: 'none', cursor: 'pointer',
          borderRadius: 999,
          padding: '5px 5px 5px 18px',   /* 5px top/bottom → círculo casi llena el alto */
          boxShadow: '0 2px 14px rgba(0,0,0,0.13)',
        }}
      >
        {/* Emoji */}
        <span style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }}>👋</span>

        {/* Texto */}
        <div style={{ textAlign: 'left', marginRight: 4 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#111', lineHeight: 1.2 }}>
            ¿Necesitas ayuda?
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#999', lineHeight: 1.35 }}>
            Haz clic aquí para chatear<br />con Anto
          </p>
        </div>

        {/* Círculo — 54px, padding del pill es 5px → margen de 5px entre círculo y borde */}
        <div style={{
          width: 54, height: 54, borderRadius: '50%',
          background: '#2D2A7A', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 3px 12px rgba(45,42,122,0.4)',
        }}>
          <MessageCircleMore size={24} color="#fff" />
        </div>

      </button>

      {/* Panel de chat — desliza desde la derecha */}
      <div style={{
        position: 'fixed', bottom: 88, right: 24, zIndex: 299,
        width: 320,
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 8px 40px rgba(0,0,0,0.13)',
        border: '1px solid #eeeeef',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        // Animación slide desde izquierda + fade
        transform: open ? 'translateX(0) scale(1)' : 'translateX(24px) scale(0.97)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'transform 0.3s cubic-bezier(0.34,1.2,0.64,1), opacity 0.25s ease',
      }}>

        {/* Header minimalista */}
        <div style={{
          padding: '14px 16px 10px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Avatar de Anto — reemplazar src cuando esté el asset */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2D2A7A, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 16,
            }}>
              👋
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#16151b', lineHeight: 1.2 }}>Anto</p>
              <p style={{ margin: 0, fontSize: 10, color: '#a2a8c0' }}>Asistente de Asegura2.com</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c4c8d4', display: 'flex', padding: 2 }}>
            <X size={15} />
          </button>
        </div>

        {/* Área de mensajes — crece dinámicamente */}
        <div style={{
          height: chatH,
          minHeight: 90,
          maxHeight: 460,
          overflowY: 'auto',
          padding: '12px 14px 6px',
          transition: 'height 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {messages.map((m, i) => {
            const esIA = m.role === 'assistant'
            return (
              <div key={i} style={{
                marginBottom: 10,
                display: 'flex',
                justifyContent: esIA ? 'flex-start' : 'flex-end',
              }}>
                <div style={{
                  maxWidth: '85%',
                  background: esIA ? '#f4f4f7' : '#2D2A7A',
                  color: esIA ? '#16151b' : '#fff',
                  borderRadius: esIA ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                  padding: '8px 11px',
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.content}
                </div>
              </div>
            )
          })}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
              <div style={{
                background: '#f4f4f7', borderRadius: '4px 12px 12px 12px',
                padding: '9px 13px', display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#a2a8c0', animation: 'dotPulse 1.2s ease-in-out 0s infinite' }} />
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#a2a8c0', animation: 'dotPulse 1.2s ease-in-out 0.2s infinite' }} />
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#a2a8c0', animation: 'dotPulse 1.2s ease-in-out 0.4s infinite' }} />
              </div>
            </div>
          )}

          {/* Chips de sugerencias — solo después del primer saludo */}
          {messages.length === 1 && !loading && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {SUGERENCIAS.map(s => (
                <button key={s} onClick={() => enviar(s)}
                  style={{
                    background: '#fff', border: '1px solid #e8e8f0',
                    borderRadius: 99, padding: '5px 11px',
                    fontSize: 11, color: '#374151', cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D2A7A'; e.currentTarget.style.color = '#2D2A7A' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e8f0'; e.currentTarget.style.color = '#374151' }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '8px 10px 12px', borderTop: '1px solid #f3f4f6', flexShrink: 0,
          display: 'flex', gap: 6, alignItems: 'flex-end',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
            placeholder="Escribe tu pregunta..."
            rows={1}
            style={{
              flex: 1, resize: 'none',
              border: '1.5px solid #e8e8f0', borderRadius: 10,
              padding: '7px 10px', fontSize: 12.5,
              fontFamily: 'inherit', outline: 'none',
              lineHeight: 1.5, maxHeight: 70, overflowY: 'auto',
              background: '#fafafa', color: '#16151b',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#2D2A7A'}
            onBlur={e => e.target.style.borderColor = '#e8e8f0'}
          />
          <button
            onClick={() => enviar()}
            disabled={!input.trim() || loading}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
              background: input.trim() && !loading ? '#2D2A7A' : '#f0f0f4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.15s',
            }}
          >
            {loading
              ? <Loader2 size={13} color="#a2a8c0" style={{ animation: 'spin 1s linear infinite' }} />
              : <Send size={13} color={input.trim() ? '#fff' : '#a2a8c0'} />
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
