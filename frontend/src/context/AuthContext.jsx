import { createContext, useContext, useState, useEffect, useRef } from 'react'

const AuthContext = createContext(null)

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function AuthProvider({ children }) {
  // ⚠️ accessToken en memoria (NO localStorage) — previene XSS
  const tokenRef = useRef(null)
  const [user,     setUser]    = useState(null)
  const [loading,  setLoading] = useState(true)
  const [avatarId, setAvatarIdState] = useState(() => localStorage.getItem('aliados_avatar') || null)

  function setAvatarId(id) {
    if (id) localStorage.setItem('aliados_avatar', id)
    else    localStorage.removeItem('aliados_avatar')
    setAvatarIdState(id)
  }

  useEffect(() => {
    // Al montar, intentar refresh con la cookie httpOnly
    silentRefresh().finally(() => setLoading(false))

    // Cuando el usuario vuelve a la pestaña tras inactividad → refrescar token
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') silentRefresh()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    // Refresh proactivo cada 10 minutos para mantener el token vivo
    const interval = setInterval(silentRefresh, 10 * 60 * 1000)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      clearInterval(interval)
    }
  }, [])

  async function silentRefresh() {
    try {
      const res = await fetch(`${API}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',   // envía la cookie refreshToken
      })
      if (res.ok) {
        const data = await res.json()
        applyToken(data.accessToken)
      } else {
        clearAuth()
      }
    } catch {
      clearAuth()
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
    } catch { clearAuth() }
  }

  function saveToken(accessToken) {
    applyToken(accessToken)
  }

  function clearAuth() {
    tokenRef.current = null
    setUser(null)
    localStorage.removeItem('aliados_avatar')
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
