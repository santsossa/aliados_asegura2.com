import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, ArrowUp, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API   = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const MAX_H = 300

// ── Markdown inline ───────────────────────────────────────────────────────────
function parseInline(text, base = 0) {
  const parts = []
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let last = 0, k = base, m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={k++}>{text.slice(last, m.index)}</span>)
    if (m[0].startsWith('**')) parts.push(<strong key={k++} style={{ fontWeight: 600 }}>{m[2]}</strong>)
    else                       parts.push(<em key={k++}>{m[3]}</em>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(<span key={k++}>{text.slice(last)}</span>)
  return parts.length ? parts : [<span key={k}>{text}</span>]
}

function MdText({ text, style }) {
  const els = []
  text.split('\n').forEach((line, i) => {
    if      (line.startsWith('### ')) els.push(<div key={i} style={{ fontWeight:700, fontSize:12.5, marginTop: i?8:0, marginBottom:2 }}>{parseInline(line.slice(4))}</div>)
    else if (line.startsWith('## '))  els.push(<div key={i} style={{ fontWeight:700, fontSize:13,   marginTop: i?8:0, marginBottom:2 }}>{parseInline(line.slice(3))}</div>)
    else if (line.startsWith('- ') || line.startsWith('* '))
      els.push(<div key={i} style={{ display:'flex', gap:5, marginBottom:2, paddingLeft:2 }}><span style={{ color:'#6b7280', flexShrink:0 }}>•</span><span>{parseInline(line.slice(2))}</span></div>)
    else if (/^\d+\.\s/.test(line)) {
      const nm = line.match(/^(\d+)\.\s(.+)/)
      if (nm) els.push(<div key={i} style={{ display:'flex', gap:5, marginBottom:2, paddingLeft:2 }}><span style={{ color:'#6b7280', flexShrink:0 }}>{nm[1]}.</span><span>{parseInline(nm[2])}</span></div>)
    }
    else if (line.trim() === '') els.push(<div key={i} style={{ height:6 }} />)
    else els.push(<div key={i} style={{ marginBottom:1 }}>{parseInline(line)}</div>)
  })
  return <div style={style}>{els}</div>
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function IAAssistant() {
  const [open,       setOpen]       = useState(false)
  const [hover,      setHover]      = useState(false)
  const [messages,   setMessages]   = useState([])
  const [input,      setInput]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [chatH,      setChatH]      = useState(0)
  const [typingIdx,  setTypingIdx]  = useState(-1)
  const [typingLen,  setTypingLen]  = useState(0)

  const inputRef    = useRef(null)
  const bottomRef   = useRef(null)
  const chatRef     = useRef(null)
  const pillRef     = useRef(null)
  const typingRef   = useRef(null)
  const justSentRef = useRef(false)
  const { getToken } = useAuth()

  // Recalcula altura del panel cuando el contenido crece (typing incluido)
  useEffect(() => {
    if (!chatRef.current) return
    const h = messages.length > 0 || loading
      ? Math.min(chatRef.current.scrollHeight, MAX_H)
      : 0
    setChatH(h)
  }, [messages, loading, typingLen])

  // Scroll al fondo SOLO cuando el usuario envía un mensaje
  useEffect(() => {
    if (!justSentRef.current) return
    justSentRef.current = false
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 340)
  }, [open])

  // Typing animation para mensajes de Anto
  useEffect(() => {
    if (!messages.length) return
    const last = messages[messages.length - 1]
    if (last.role !== 'assistant') return
    const idx = messages.length - 1
    clearInterval(typingRef.current)
    setTypingIdx(idx)
    setTypingLen(0)
    typingRef.current = setInterval(() => {
      setTypingLen(prev => {
        const next = prev + 4
        if (next >= last.content.length) {
          clearInterval(typingRef.current)
          setTypingIdx(-1)
          return last.content.length
        }
        return next
      })
    }, 8)
    return () => clearInterval(typingRef.current)
  }, [messages.length])

  const handleClose = useCallback(() => {
    clearInterval(typingRef.current)
    setOpen(false)
    setInput('')
    setMessages([])
    setChatH(0)
    setTypingIdx(-1)
    setTypingLen(0)
  }, [])

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (pillRef.current && !pillRef.current.contains(e.target)) handleClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, handleClose])

  async function enviar(texto) {
    const q = (texto ?? input).trim()
    if (!q || loading) return
    setInput('')
    const hist = [...messages, { role: 'user', content: q }]
    justSentRef.current = true
    setMessages(hist)
    setLoading(true)
    try {
      const r    = await fetch(`${API}/api/ia/chat`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
        body:        JSON.stringify({ messages: hist }),
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

  const totalH = open ? 50 + (chatH > 0 ? chatH + 1 : 0) : 58

  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:300, display:'flex', alignItems:'flex-end' }}>

      {/* Hover label */}
      <div style={{
        background:'#fff', borderRadius:14, overflow:'hidden', whiteSpace:'nowrap',
        maxWidth:     (hover && !open) ? 220 : 0,
        opacity:      (hover && !open) ? 1   : 0,
        paddingLeft:  (hover && !open) ? 16  : 0,
        paddingRight: (hover && !open) ? 14  : 0,
        paddingTop:10, paddingBottom:10,
        marginRight:  (hover && !open) ? 8   : 0,
        boxShadow: (hover && !open) ? '0 2px 16px rgba(0,0,0,0.11)' : 'none',
        transition:'max-width 0.28s cubic-bezier(0.4,0,0.2,1),opacity 0.2s ease,padding 0.2s ease,margin 0.2s ease',
      }}>
        <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#111', lineHeight:1.2 }}>Pregúntale a Anto ✨</p>
        <p style={{ margin:'3px 0 0', fontSize:11, color:'#6d28d9', lineHeight:1.3 }}>Coberturas · precios · comparaciones</p>
      </div>

      {/* Contenedor principal */}
      <div
        ref={pillRef}
        onMouseEnter={() => !open && setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={!open ? () => { setHover(false); setOpen(true) } : undefined}
        style={{
          position:'relative',
          width:        open ? 320 : 58,
          height:       totalH,
          // Pill cuando está cerrado; card (20px) cuando está abierto — sin transición de forma
          borderRadius: open ? 20 : 999,
          background:   open ? '#fff' : 'linear-gradient(135deg,#4f46e5 0%,#2D2A7A 100%)',
          border:       open ? '1.5px solid #e5e7eb' : '1.5px solid transparent',
          boxShadow:    open
            ? '0 4px 28px rgba(0,0,0,0.13)'
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
            'background 0.22s ease',
            'box-shadow 0.2s ease',
            'transform 0.2s ease',
          ].join(', '),
        }}
      >
        {/* Sparkles — cuando está cerrada */}
        <div style={{
          position:'absolute', inset:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          opacity: open ? 0 : 1,
          transition:'opacity 0.12s ease',
          pointerEvents:'none',
        }}>
          <Sparkles size={24} color="#fff" />
        </div>

        {/* Área de mensajes */}
        {open && (
          <div
            ref={chatRef}
            style={{
              overflowY:  'auto',
              maxHeight:  MAX_H,
              padding:    chatH > 0 ? '14px 18px 8px' : '0',
              flexShrink: 0,
            }}
          >
            {messages.map((m, i) => {
              const esIA    = m.role === 'assistant'
              const content = (typingIdx === i)
                ? m.content.slice(0, typingLen)
                : m.content
              return (
                <div key={i} style={{ marginBottom:10, display:'flex', justifyContent: esIA ? 'flex-start' : 'flex-end' }}>
                  {esIA && (
                    <div style={{ width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#2D2A7A)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginRight:7, marginTop:2 }}>
                      <Sparkles size={10} color="#fff" />
                    </div>
                  )}
                  {esIA ? (
                    <MdText
                      text={content}
                      style={{ fontFamily:'Inter', fontSize:12.5, lineHeight:1.7, color:'#111827', maxWidth:'82%' }}
                    />
                  ) : (
                    <div style={{ maxWidth:'78%', background:'rgba(45,42,122,0.08)', color:'#1e1b4b', borderRadius:'12px 3px 12px 12px', padding:'7px 11px', fontFamily:'Inter', fontSize:12.5, lineHeight:1.6, whiteSpace:'pre-wrap' }}>
                      {m.content}
                    </div>
                  )}
                </div>
              )
            })}

            {loading && (
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#2D2A7A)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Sparkles size={10} color="#fff" />
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  {[0,0.18,0.36].map((d,j) => (
                    <span key={j} style={{ display:'inline-block', width:5, height:5, borderRadius:'50%', background:'#9ca3af', animation:`dp 1.2s ease-in-out ${d}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Separador sutil */}
        {open && chatH > 0 && (
          <div style={{ height:1, background:'#f0f0f2', flexShrink:0 }} />
        )}

        {/* Input — parte baja fija */}
        {open && (
          <div style={{
            height:50, flexShrink:0,
            display:'flex', alignItems:'center',
            padding:'0 6px 0 16px', gap:6,
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
              style={{ flex:1, border:'none', outline:'none', fontFamily:'Inter', fontSize:13.5, color:'#111827', background:'transparent', minWidth:0 }}
            />
            <button
              onClick={handleClose}
              style={{ width:24, height:24, borderRadius:'50%', border:'none', background:'transparent', cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af' }}
            >
              <X size={12} />
            </button>
            <button
              onClick={() => enviar()}
              style={{
                width:32, height:32, borderRadius:'50%', border:'none',
                background: input.trim() && !loading ? '#2D2A7A' : '#e5e7eb',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                transition:'background 0.15s', flexShrink:0,
              }}
            >
              <ArrowUp size={13} color={input.trim() && !loading ? '#fff' : '#9ca3af'} />
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes dp{0%,80%,100%{transform:scale(0.6);opacity:.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  )
}
