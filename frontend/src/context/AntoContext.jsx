import { createContext, useContext, useState } from 'react'

export const CONV_KEY  = 'anto_convs'
export const MAX_CONVS = 10

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function generateTitle(userMsg, assistantMsg, getToken) {
  try {
    const r = await fetch(`${API}/api/ia/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      credentials: 'include',
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `Genera un título muy corto (máximo 5 palabras) que describa de qué trata esta conversación sobre seguros. Responde SOLO con el título, sin comillas ni puntuación al final.\n\nPregunta: "${userMsg.slice(0, 200)}"\nRespuesta: "${assistantMsg.slice(0, 300)}"`,
        }],
      }),
    })
    const data = await r.json()
    if (data.status === 'success') return data.message.trim().replace(/^["""'']+|["""'']+$/g, '').replace(/\.$/, '')
    return null
  } catch {
    return null
  }
}

export function loadConvs()      { try { return JSON.parse(localStorage.getItem(CONV_KEY) || '[]') } catch { return [] } }
export function saveConvs(convs) { try { localStorage.setItem(CONV_KEY, JSON.stringify(convs)) } catch {} }

const AntoContext = createContext(null)

export function AntoProvider({ children }) {
  const [convs,         setConvsRaw] = useState(() => loadConvs())
  const [activeId,      setActiveId] = useState(null)
  const [pendingAction, setPending]  = useState(null) // { type:'select'|'new', id? }

  function setConvs(updater) {
    setConvsRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveConvs(next)
      return next
    })
  }

  function upsertConv(conv) {
    setConvs(prev => {
      const exists = prev.find(c => c.id === conv.id)
      if (exists) return prev.map(c => c.id === conv.id ? { ...c, ...conv } : c)
      return [conv, ...prev].slice(0, MAX_CONVS)
    })
  }

  function deleteConv(id) {
    setConvs(prev => prev.filter(c => c.id !== id))
  }

  function selectConv(id) { setPending({ type: 'select', id }) }
  function newConv()       { setPending({ type: 'new' }) }

  return (
    <AntoContext.Provider value={{ convs, setConvs, activeId, setActiveId, pendingAction, setPending, upsertConv, deleteConv, selectConv, newConv }}>
      {children}
    </AntoContext.Provider>
  )
}

export const useAnto = () => useContext(AntoContext)
