import { useState, useRef, useEffect } from 'react'
import { Loader2, Shield, Scale, MessageCircle, FileCheck, Sparkles, ArrowUp, Copy, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useAnto, generateTitle } from '../../context/AntoContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const QUICK_CARDS = [
  { icon: Shield,        bg: '#f5f3ff', color: '#7c3aed', title: 'Coberturas',           prompt: '¿Qué coberturas son más importantes en un seguro de automóvil y cómo se las explico al cliente?' },
  { icon: Scale,         bg: '#eff6ff', color: '#2563eb', title: 'Comparar aseguradoras', prompt: '¿Cuáles son las principales diferencias entre las aseguradoras disponibles y cuál recomiendas?' },
  { icon: MessageCircle, bg: '#f0fdf4', color: '#16a34a', title: 'Responder al cliente',  prompt: '¿Cómo respondo a un cliente que dice que el seguro es muy caro?' },
  { icon: FileCheck,     bg: '#fff7ed', color: '#ea580c', title: 'Proceso de emisión',    prompt: '¿Cuáles son los pasos para emitir una póliza y qué documentos necesita el cliente?' },
]

function parseInline(text, baseKey = 0) {
  const parts = [], regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let last = 0, k = baseKey, m
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={k++}>{text.slice(last, m.index)}</span>)
    if (m[0].startsWith('**')) parts.push(<strong key={k++} style={{ fontWeight:600 }}>{m[2]}</strong>)
    else                       parts.push(<em key={k++}>{m[3]}</em>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(<span key={k++}>{text.slice(last)}</span>)
  return parts.length ? parts : [<span key={k}>{text}</span>]
}

function MarkdownText({ text, style }) {
  const els = []
  text.split('\n').forEach((line, i) => {
    if      (line.startsWith('### ')) els.push(<div key={i} style={{ fontWeight:700, fontSize:14.5, color:'#111827', marginTop:i>0?10:0, marginBottom:3 }}>{parseInline(line.slice(4))}</div>)
    else if (line.startsWith('## '))  els.push(<div key={i} style={{ fontWeight:700, fontSize:15,   color:'#111827', marginTop:i>0?12:0, marginBottom:3 }}>{parseInline(line.slice(3))}</div>)
    else if (line.startsWith('# '))   els.push(<div key={i} style={{ fontWeight:700, fontSize:16,   color:'#111827', marginTop:i>0?14:0, marginBottom:4 }}>{parseInline(line.slice(2))}</div>)
    else if (line.startsWith('- ') || line.startsWith('* '))
      els.push(<div key={i} style={{ display:'flex', gap:6, marginBottom:3, paddingLeft:4 }}><span style={{ color:'#6b7280', flexShrink:0 }}>•</span><span>{parseInline(line.slice(2))}</span></div>)
    else if (/^\d+\.\s/.test(line)) {
      const nm = line.match(/^(\d+)\.\s(.+)/)
      if (nm) els.push(<div key={i} style={{ display:'flex', gap:6, marginBottom:3, paddingLeft:4 }}><span style={{ color:'#6b7280', flexShrink:0, minWidth:14 }}>{nm[1]}.</span><span>{parseInline(nm[2])}</span></div>)
    }
    else if (line.trim() === '') els.push(<div key={i} style={{ height:8 }} />)
    else                         els.push(<div key={i} style={{ marginBottom:2 }}>{parseInline(line)}</div>)
  })
  return <div style={style}>{els}</div>
}

export default function Anto() {
  const { getToken, user } = useAuth()
  const { convs, activeId, setActiveId, pendingAction, setPending, upsertConv } = useAnto()
  const nombre = user?.nombre || user?.email?.split('@')[0] || 'aliado'

  const [messages,   setMessages]   = useState([])
  const [input,      setInput]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [hoveredMsg, setHoveredMsg] = useState(null)
  const [copiedMsg,  setCopiedMsg]  = useState(null)
  const [typingIdx,  setTypingIdx]  = useState(null)
  const [typingLen,  setTypingLen]  = useState(0)

  const bottomRef    = useRef(null)
  const msgsRef      = useRef(null)
  const userMsgRef   = useRef(null)
  const justSentRef  = useRef(false)
  const restoringRef = useRef(false)
  const activeIdRef  = useRef(null)
  const inputRef     = useRef(null)
  const typingRef    = useRef(null)

  // Reacciona a acciones del topbar (selectConv / newConv)
  useEffect(() => {
    if (!pendingAction) return
    setPending(null)

    if (pendingAction.type === 'new') {
      clearInterval(typingRef.current)
      setMessages([]); setActiveId(null); activeIdRef.current = null
      setTypingIdx(null); setTypingLen(0)
      return
    }

    if (pendingAction.type === 'select') {
      const conv = convs.find(c => c.id === pendingAction.id)
      if (!conv) return
      clearInterval(typingRef.current)
      restoringRef.current = true
      setMessages(conv.messages)
      setActiveId(conv.id); activeIdRef.current = conv.id
      setTypingIdx(null); setTypingLen(0)
      requestAnimationFrame(() => { restoringRef.current = false })
    }
  }, [pendingAction]) // eslint-disable-line react-hooks/exhaustive-deps

  function copiar(idx, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMsg(idx)
      setTimeout(() => setCopiedMsg(null), 1500)
    })
  }

  useEffect(() => {
    if (!justSentRef.current) return
    justSentRef.current = false
    const r1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = msgsRef.current, el = userMsgRef.current
        if (!container || !el) return
        container.scrollTop = el.offsetTop - container.offsetTop - 16
      })
    })
    return () => cancelAnimationFrame(r1)
  }, [messages])

  useEffect(() => {
    if (restoringRef.current) return
    const last = messages[messages.length - 1]
    if (!last || last.role !== 'assistant') return
    const idx = messages.length - 1
    setTypingIdx(idx); setTypingLen(0)
    clearInterval(typingRef.current)
    let i = 0
    typingRef.current = setInterval(() => {
      i += 4; setTypingLen(i)
      if (i >= last.content.length) { clearInterval(typingRef.current); setTypingIdx(null) }
    }, 8)
    return () => clearInterval(typingRef.current)
  }, [messages.length]) // eslint-disable-line react-hooks/exhaustive-deps

  async function enviar(texto) {
    const pregunta = (texto ?? input).trim()
    if (!pregunta || loading) return
    setInput('')

    let convId = activeIdRef.current
    const isNew = !convId
    if (isNew) {
      convId = `conv_${Date.now()}`
      activeIdRef.current = convId
      setActiveId(convId)
    }

    const historial = [...messages, { role: 'user', content: pregunta }]
    justSentRef.current = true
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
      const reply = { role: 'assistant', content: data.status === 'success' ? data.message : '⚠️ No pude obtener una respuesta. Intenta de nuevo.' }
      const fullMessages = [...historial, reply]
      setMessages(fullMessages)

      const tempTitle = pregunta.length > 48 ? pregunta.slice(0, 48) + '…' : pregunta
      upsertConv({ id: convId, title: tempTitle, messages: fullMessages, updatedAt: Date.now() })

      if (isNew) {
        generateTitle(pregunta, reply.content, getToken).then(aiTitle => {
          if (aiTitle) upsertConv({ id: convId, title: aiTitle, messages: fullMessages, updatedAt: Date.now() })
        })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sin conexión con Anto.' }])
    } finally {
      setLoading(false)
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'transparent', overflow:'hidden' }}>

      <div ref={msgsRef} className="anto-msgs" style={{ flex:1, overflowY:'auto', overflowAnchor:'none', padding: hasMessages ? '24px 32px' : '0 32px' }}>
        {!hasMessages ? (
          <div style={{ maxWidth:520, margin:'0 auto', paddingTop:56, paddingBottom:24 }}>
            <div style={{ marginBottom:32, textAlign:'center' }}>
              <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#2D2A7A)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
                <Sparkles size={22} color="#fff" />
              </div>
              <h1 style={{ margin:'0 0 10px', fontFamily:'Poppins', fontWeight:700, fontSize:26, color:'#111827' }}>
                Hola, {nombre} 👋
              </h1>
              <p style={{ margin:0, fontFamily:'Inter', fontSize:14, color:'#6b7280', lineHeight:1.6 }}>
                Soy Anto, tu asistente de seguros.<br />Pregúntame lo que necesites saber.
              </p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {QUICK_CARDS.map((c, i) => {
                const Icon = c.icon
                return (
                  <button key={i} onClick={() => enviar(c.prompt)}
                    style={{ display:'flex', alignItems:'center', gap:12, background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:14, padding:'14px 16px', cursor:'pointer', textAlign:'left', transition:'border-color 0.15s, box-shadow 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#c4b5fd'; e.currentTarget.style.boxShadow='0 4px 16px rgba(87,69,171,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='#e5e7eb'; e.currentTarget.style.boxShadow='none' }}
                  >
                    <div style={{ width:36, height:36, borderRadius:10, background:c.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon size={17} color={c.color} />
                    </div>
                    <span style={{ fontFamily:'Inter', fontSize:13, fontWeight:500, color:'#374151', flex:1 }}>{c.title}</span>
                    <span style={{ fontSize:16, color:'#9ca3af', flexShrink:0, fontWeight:300 }}>+</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth:640, margin:'0 auto' }}>
            {messages.map((m, i) => {
              const esIA = m.role === 'assistant'
              const displayText = typingIdx === i ? m.content.slice(0, typingLen) : m.content
              return (
                <div key={i} style={{ marginBottom: esIA ? 20 : 14, display:'flex', justifyContent: esIA ? 'flex-start' : 'flex-end' }}>
                  {esIA && (
                    <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#2D2A7A)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginRight:10, marginTop:2 }}>
                      <Sparkles size={12} color="#fff" />
                    </div>
                  )}
                  {esIA ? (
                    <div onMouseEnter={() => setHoveredMsg(i)} onMouseLeave={() => setHoveredMsg(null)} style={{ maxWidth:'78%' }}>
                      <MarkdownText text={displayText} style={{ fontFamily:'Inter', fontSize:13.5, lineHeight:1.75, color:'#111827' }} />
                      <button
                        onClick={() => copiar(i, m.content)}
                        style={{ display:'flex', alignItems:'center', gap:4, marginTop:6, padding:'3px 8px', border:'none', background:'transparent', cursor:'pointer', fontFamily:'Inter', fontSize:11, color:'#9ca3af', borderRadius:6, opacity:(hoveredMsg===i && typingIdx!==i)?1:0, pointerEvents:(hoveredMsg===i && typingIdx!==i)?'auto':'none', transition:'opacity 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color='#6b7280'}
                        onMouseLeave={e => e.currentTarget.style.color='#9ca3af'}
                      >
                        {copiedMsg === i ? <Check size={11} /> : <Copy size={11} />}
                        {copiedMsg === i ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                  ) : (
                    <div ref={i === messages.length - 1 ? userMsgRef : null}
                      style={{ maxWidth:'72%', background:'rgba(45,42,122,0.08)', color:'#1e1b4b', borderRadius:'16px 4px 16px 16px', padding:'9px 14px', fontFamily:'Inter', fontSize:13.5, lineHeight:1.65, whiteSpace:'pre-wrap' }}>
                      {m.content}
                    </div>
                  )}
                </div>
              )
            })}
            {loading && (
              <div style={{ display:'flex', alignItems:'flex-start', marginBottom:16 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#2D2A7A)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginRight:10, marginTop:2 }}>
                  <Sparkles size={12} color="#fff" />
                </div>
                <div style={{ paddingTop:6, display:'flex', gap:5, alignItems:'center' }}>
                  {[0, 0.2, 0.4].map((d, j) => (
                    <span key={j} style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'#9ca3af', animation:`dp 1.2s ease-in-out ${d}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="anto-input" style={{ padding:'12px 32px 20px', flexShrink:0 }}>
        <div style={{ maxWidth:740, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, border:'1.5px solid #e5e7eb', borderRadius:999, background:'#fff', padding:'8px 8px 8px 14px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', transition:'border-color 0.15s' }}
            onFocusCapture={e => e.currentTarget.style.borderColor='#a5b4fc'}
            onBlurCapture={e  => e.currentTarget.style.borderColor='#e5e7eb'}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); enviar() } }}
              placeholder="Pregúntale a Anto..."
              style={{ flex:1, border:'none', outline:'none', fontFamily:'Inter', fontSize:14, color:'#111827', background:'transparent', lineHeight:1.5, minWidth:0 }}
            />
            <button
              onClick={() => enviar()}
              disabled={!input.trim() || loading}
              style={{ width:34, height:34, borderRadius:'50%', border:'none', cursor: input.trim() && !loading ? 'pointer' : 'default', background: input.trim() && !loading ? '#2D2A7A' : '#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s', flexShrink:0 }}
            >
              {loading ? <Loader2 size={13} color="#9ca3af" style={{ animation:'spin 1s linear infinite' }} /> : <ArrowUp size={13} color={input.trim() ? '#fff' : '#9ca3af'} />}
            </button>
          </div>
          <p style={{ margin:'6px 0 0', fontFamily:'Inter', fontSize:11, color:'#d1d5db', textAlign:'center' }}>
            Anto puede cometer errores. Verifica la información importante.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes dp   { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .anto-msgs * { overflow-anchor: none; }
        @media (max-width: 640px) {
          .anto-msgs  { padding: 16px 16px !important; }
          .anto-input { padding: 8px 16px 16px !important; }
        }
      `}</style>
    </div>
  )
}
