import { createContext, useContext, useState, useEffect, useRef } from 'react'

const AuthContext = createContext(null)

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function AuthProvider({ children }) {
  // ⚠️ accessToken en memoria (NO localStorage) — previene XSS
  const tokenRef = useRef(null)
  const [user,     setUser]    = useState(null)
  const [loading,  setLoading] = useState(true)
  const [avatarId, setAvatarIdState] = useState(null)

  function setAvatarId(id) {
    setAvatarIdState(id || null)
  }

  useEffect(() => {
    silentRefresh().finally(() => setLoading(false))

    // Delay de 1.5s al volver visible: la red puede tardar en reconectarse tras el sueño del PC
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') setTimeout(silentRefresh, 1500)
    }
    // Refresh inmediato cuando se recupera la conexión a internet
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

  async function silentRefresh() {
    try {
      const res = await fetch(`${API}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        applyToken(data.accessToken)
      } else if (res.status === 401) {
        // Solo cerrar sesión si el servidor rechaza explícitamente el refresh token
        clearAuth()
      }
      // En 5xx u otros errores HTTP: mantener estado actual, reintentar en el próximo ciclo
    } catch {
      // Error de red (sin internet, PC en sueño, etc.) — NO cerrar sesión.
      // La cookie sigue válida; se reintenta al volver la conexión o tras el intervalo.
    }
  }

  function applyToken(accessToken) {
    tokenRef.current = accessToken   // en memoria, nunca en localStorage
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
    } catch { clearAuth() }
  }

  function saveToken(accessToken) {
    applyToken(accessToken)
  }

  function clearAuth() {
    tokenRef.current = null
    setUser(null)
    setAvatarIdState(null)
  }

  function getToken() {
    return tokenRef.current
  }

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
