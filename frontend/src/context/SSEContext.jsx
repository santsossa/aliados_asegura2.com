/**
 * SSEContext — Una sola conexión EventSource por sesión de aliado.
 * - Reconecta automáticamente si el token cambia o la conexión cae
 * - Vuelve a conectar cuando el tab recupera el foco (fallback ante caídas)
 * - Emite '__refresh' para que los componentes recarguen sus datos
 */
import { createContext, useContext, useEffect, useRef, useCallback, useMemo } from 'react'

const SSECtx = createContext({ subscribe: () => () => {} })

const API    = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const EVENTS = ['notificacion', 'poliza_update']

export function SSEProvider({ children }) {
  const listeners = useRef({})   // eventName → Set<handler>
  const esRef     = useRef(null)
  const retryRef  = useRef(null)

  function connect() {
    // Limpiar reintento pendiente
    if (retryRef.current) { clearTimeout(retryRef.current); retryRef.current = null }
    // Cerrar conexión anterior
    if (esRef.current)    { esRef.current.close(); esRef.current = null }

    const token = localStorage.getItem('token')
    if (!token) return

    const url = `${API}/api/notificaciones/stream?token=${encodeURIComponent(token)}`
    const es  = new EventSource(url)
    esRef.current = es

    EVENTS.forEach(ev => {
      es.addEventListener(ev, (e) => {
        try {
          const data = JSON.parse(e.data)
          listeners.current[ev]?.forEach(fn => fn(data))
        } catch { /* payload inválido */ }
      })
    })

    // Error (token expirado, red caída, etc.) → reintenta en 5 s con token fresco
    es.onerror = () => {
      if (esRef.current) { esRef.current.close(); esRef.current = null }
      retryRef.current = setTimeout(connect, 5_000)
    }
  }

  useEffect(() => {
    connect()

    // Al volver al tab: reconectar + avisar a componentes que refresquen datos
    function onVisibility() {
      if (document.visibilityState === 'visible') {
        connect()
        listeners.current['__refresh']?.forEach(fn => fn())
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      if (retryRef.current) clearTimeout(retryRef.current)
      if (esRef.current)    esRef.current.close()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, []) // eslint-disable-line

  // useCallback con deps vacíos → referencia estable entre renders
  // Esto evita que useEffect([subscribe]) en consumidores se re-ejecute en
  // cada render, lo que creaba un gap donde los eventos SSE se perdían.
  const subscribe = useCallback((event, handler) => {
    if (!listeners.current[event]) listeners.current[event] = new Set()
    listeners.current[event].add(handler)
    return () => listeners.current[event]?.delete(handler)
  }, [])

  const ctx = useMemo(() => ({ subscribe }), [subscribe])

  return <SSECtx.Provider value={ctx}>{children}</SSECtx.Provider>
}

export const useSSE = () => useContext(SSECtx)
