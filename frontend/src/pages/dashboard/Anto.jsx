import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Shield, Scale, MessageCircle, FileCheck, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'


const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const QUICK_CARDS = [
  { icon: Shield,        bg: '#f5f3ff', color: '#7c3aed', title: 'Coberturas',            prompt: '¿Qué coberturas son más importantes en un seguro de automóvil y cómo se las explico al cliente?' },
  { icon: Scale,         bg: '#eff6ff', color: '#2563eb', title: 'Comparar aseguradoras',  prompt: '¿Cuáles son las principales diferencias entre las aseguradoras disponibles y cuál recomiendas?' },
  { icon: MessageCircle, bg: '#f0fdf4', color: '#16a34a', title: 'Responder al cliente',   prompt: '¿Cómo respondo a un cliente que dice que el seguro es muy caro?' },
  { icon: FileCheck,     bg: '#fff7ed', color: '#ea580c', title: 'Proceso de emisión',     prompt: '¿Cuáles son los pasos para emitir una póliza y qué documentos necesita el cliente?' },
]


export default function Anto() {
  const { getToken, user } = useAuth()
  const nombre = user?.nombre || user?.email?.split('@')[0] || 'aliado'

  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [input])

  async function enviar(texto) {
    const pregunta = (texto ?? input).trim()
    if (!pregunta || loading) return
    setInput('')
    const historial = [...messages, { role: 'user', content: pregunta }]
    setMessages(historial)
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/ia/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
        body: JSON.stringify({ messages: historial }),
      })
      const data = await r.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.status === 'success' ? data.message : '⚠️ No pude obtener una respuesta. Intenta de nuevo.',
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sin conexión con Anto.' }])
    } finally {
      setLoading(false)
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent', overflow: 'hidden' }}>


        {/* Área de mensajes / bienvenida */}
        <div style={{ flex: 1, overflowY: 'auto', padding: hasMessages ? '24px 32px' : '0 32px' }}>

          {!hasMessages ? (
            /* ── Bienvenida ── */
            <div style={{ maxWidth: 520, margin: '0 auto', paddingTop: 56, paddingBottom: 24 }}>
              <div style={{ marginBottom: 32, textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#2D2A7A)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  <Sparkles size={22} color="#fff" />
                </div>
                <h1 style={{ margin: '0 0 10px', fontFamily: 'Poppins', fontWeight: 700, fontSize: 26, color: '#111827' }}>
                  Hola, {nombre} 👋
                </h1>
                <p style={{ margin: 0, fontFamily: 'Inter', fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                  Soy Anto, tu asistente de seguros.<br />Pregúntame lo que necesites saber.
                </p>
              </div>

              {/* Cards rápidas 2×2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {QUICK_CARDS.map((c, i) => {
                  const Icon = c.icon
                  return (
                    <button
                      key={i}
                      onClick={() => enviar(c.prompt)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: '#fff', border: '1.5px solid #e5e7eb',
                        borderRadius: 14, padding: '14px 16px',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#c4b5fd'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(87,69,171,0.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={17} color={c.color} />
                      </div>
                      <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 500, color: '#374151', flex: 1 }}>{c.title}</span>
                      <span style={{ fontSize: 16, color: '#9ca3af', flexShrink: 0, fontWeight: 300 }}>+</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            /* ── Chat messages ── */
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              {messages.map((m, i) => {
                const esIA = m.role === 'assistant'
                return (
                  <div key={i} style={{ marginBottom: 16, display: 'flex', justifyContent: esIA ? 'flex-start' : 'flex-end' }}>
                    {esIA && (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#2D2A7A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10, marginTop: 2 }}>
                        <Sparkles size={12} color="#fff" />
                      </div>
                    )}
                    <div style={{
                      maxWidth: '78%',
                      background: esIA ? '#f9fafb' : '#2D2A7A',
                      color: esIA ? '#111827' : '#fff',
                      border: esIA ? '1px solid #e5e7eb' : 'none',
                      borderRadius: esIA ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                      padding: '10px 14px',
                      fontFamily: 'Inter', fontSize: 13.5, lineHeight: 1.65,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {m.content}
                    </div>
                  </div>
                )
              })}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#2D2A7A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10, marginTop: 2 }}>
                    <Sparkles size={12} color="#fff" />
                  </div>
                  <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px 16px 16px 16px', padding: '12px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 0.2, 0.4].map((d, i) => (
                      <span key={i} style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#9ca3af', animation: `dp 1.2s ease-in-out ${d}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── Input bar ── */}
        <div style={{ padding: '12px 32px 20px', borderTop: hasMessages ? '1px solid #e5e7eb' : 'none', flexShrink: 0 }}>
          <div style={{ maxWidth: hasMessages ? 640 : 520, margin: '0 auto' }}>
            <div style={{
              border: '1.5px solid #e5e7eb', borderRadius: 16,
              background: '#fff', overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              transition: 'border-color 0.15s',
            }}
              onFocusCapture={e => e.currentTarget.style.borderColor = '#a5b4fc'}
              onBlurCapture={e => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
                placeholder="Pregúntale algo a Anto..."
                rows={1}
                style={{
                  width: '100%', border: 'none', outline: 'none', resize: 'none',
                  padding: '14px 16px 8px', fontFamily: 'Inter', fontSize: 14, color: '#111827',
                  background: 'transparent', lineHeight: 1.5, boxSizing: 'border-box',
                  minHeight: 48,
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px 10px' }}>
                <span style={{ fontFamily: 'Inter', fontSize: 11, color: '#9ca3af' }}>
                  Shift + Enter para nueva línea
                </span>
                <button
                  onClick={() => enviar()}
                  disabled={!input.trim() || loading}
                  style={{
                    width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
                    background: input.trim() && !loading ? '#2D2A7A' : '#e5e7eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s', flexShrink: 0,
                  }}
                >
                  {loading
                    ? <Loader2 size={14} color="#9ca3af" style={{ animation: 'spin 1s linear infinite' }} />
                    : <Send size={14} color={input.trim() ? '#fff' : '#9ca3af'} />
                  }
                </button>
              </div>
            </div>
            <p style={{ margin: '8px 0 0', fontFamily: 'Inter', fontSize: 11, color: '#d1d5db', textAlign: 'center' }}>
              Anto puede cometer errores. Verifica la información importante.
            </p>
          </div>
        </div>

      <style>{`
        @keyframes dp { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
