import { createContext, useContext, useState } from 'react'

export const CONV_KEY  = 'anto_convs'
export const MAX_CONVS = 10

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
