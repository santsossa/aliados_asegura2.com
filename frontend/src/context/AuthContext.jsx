import { createContext, useContext, useState, useEffect, useRef } from 'react'

const AuthContext = createContext(null)

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Flag en localStorage para saber si el usuario tenía sesión activa.
// NO guarda el token (sigue en memoria) — solo indica "intenta recuperar sesión".
const SESSION_FLAG = 'as2_has_sess'

export function AuthProvider({ children }) {
  const tokenRef         = useRef(null)
  const refreshInFlight  = useRef(null)   // deduplica llamadas simultáneas
  const [user,     setUser]          = useState(null)
  const [loading,  setLoading]       = useState(true)
  const [avatarId, setAvatarIdState] = useState(null)

  function setAvatarId(id) { setAvatarIdState(id || null) }

  function applyToken(accessToken) {
    tokenRef.current = accessToken
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      setUser({
        id:              payload.sub,
        email:           payload.email,
        tipo:            payload.tipo,
        rol:             payload.rol,
        nombre:          payload.nombre,
        apellido:        payload.apellido,
        onboarding_step: payload.onboarding_step ?? null,
      })
      setAvatarIdState(payload.avatar_id || null)
      localStorage.setItem(SESSION_FLAG, '1')
    } catch { clearAuth() }
  }

  function saveToken(accessToken) { applyToken(accessToken) }

  function clearAuth() {
    tokenRef.current = null
    setUser(null)
    setAvatarIdState(null)
    localStorage.removeItem(SESSION_FLAG)
  }

  function getToken() { return tokenRef.current }

  // silentRefresh con deduplicación: si ya hay un request en vuelo,
  // todas las llamadas simultáneas esperan el mismo resultado.
  function silentRefresh() {
    if (refreshInFlight.current) return refreshInFlight.current

    const promise = (async () => {
      try {
        const res = await fetch(`${API}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          applyToken(data.accessToken)
        } else if (res.status === 401) {
          clearAuth()
        }
        // 5xx u otros: no tocar el estado, reintentar en el próximo ciclo
      } catch {
        // Error de red: no cerrar sesión
      } finally {
        refreshInFlight.current = null
      }
    })()

    refreshInFlight.current = promise
    return promise
  }

  useEffect(() => {
    const hadSession = !!localStorage.getItem(SESSION_FLAG)

    // En el arranque reintentar si el usuario tenía sesión activa,
    // para resistir red lenta o PC despertando del sueño.
    async function initialRefresh() {
      const maxAttempts = hadSession ? 4 : 1
      const delays      = [0, 1500, 3000, 5000]   // ms entre intentos

      for (let i = 0; i < maxAttempts; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, delays[i]))
        try {
          const res = await fetch(`${API}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          })
          if (res.ok) {
            const data = await res.json()
            applyToken(data.accessToken)
            return   // éxito — salir del loop
          }
          if (res.status === 401) {
            clearAuth()
            return   // token inválido/expirado — salir sin más reintentos
          }
          // 5xx u otro: volver a intentar
        } catch {
          // Error de red: volver a intentar
        }
      }
      // Todos los intentos fallaron por red/servidor — no cerrar sesión,
      // el usuario verá el dashboard si ya estaba autenticado en memoria,
      // o el login si no lo estaba.
    }

    initialRefresh().finally(() => setLoading(false))

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        // Delay para que la red termine de reconectarse tras sueño del PC
        setTimeout(silentRefresh, 2000)
      }
    }
    function onOnline() { silentRefresh() }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('online', onOnline)
    const interval = setInterval(silentRefresh, 10 * 60 * 1000)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('online', onOnline)
      clearInterval(interval)
    }
  }, [])

  async function logout() {
    try {
      await fetch(`${API}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenRef.current}` },
        credentials: 'include',
      })
    } catch { /* continuar */ }
    clearAuth()
  }

  const isAdmin  = user?.tipo === 'admin'
  const isAliado = user?.tipo === 'aliado'
  const isAuth   = !!user

  return (
    <AuthContext.Provider value={{ user, loading, isAuth, isAdmin, isAliado, saveToken, clearAuth, logout, silentRefresh, getToken, avatarId, setAvatarId }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
