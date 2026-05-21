/**
 * SSEContext — Una sola conexión EventSource por sesión de aliado.
 * Los componentes se suscriben a eventos específicos con useSSE().
 */
import { createContext, useContext, useEffect, useRef } from 'react'

const SSECtx = createContext({ subscribe: () => () => {} })

const API    = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const EVENTS = ['notificacion', 'poliza_update']

export function SSEProvider({ children }) {
  // Map: eventName → Set<handler>
  const listeners = useRef({})

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const url = `${API}/api/notificaciones/stream?token=${encodeURIComponent(token)}`
    const es  = new EventSource(url)

    EVENTS.forEach(ev => {
      es.addEventListener(ev, (e) => {
        try {
          const data = JSON.parse(e.data)
          listeners.current[ev]?.forEach(fn => fn(data))
        } catch { /* payload inválido */ }
      })
    })

    return () => es.close()
  }, [])

  /** Suscribe un handler a un evento SSE. Devuelve función de cleanup. */
  function subscribe(event, handler) {
    if (!listeners.current[event]) listeners.current[event] = new Set()
    listeners.current[event].add(handler)
    return () => listeners.current[event]?.delete(handler)
  }

  return <SSECtx.Provider value={{ subscribe }}>{children}</SSECtx.Provider>
}

export const useSSE = () => useContext(SSECtx)
