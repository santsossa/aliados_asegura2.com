import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Redirige al login si no está autenticado */
export function ProtectedRoute({ children }) {
  const { isAuth, loading } = useAuth()
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>Cargando...</div>
  if (!isAuth) return <Navigate to="/login" replace />
  return children
}

/** Solo permite admins */
export function AdminRoute({ children }) {
  const { isAuth, isAdmin, loading } = useAuth()
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>Cargando...</div>
  if (!isAuth) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

/** Solo permite aliados — redirige a /onboarding si no ha completado el flujo */
export function AliasRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>Cargando...</div>
  if (!user || user.tipo !== 'aliado') return <Navigate to="/login" replace />
  if (user.onboarding_step !== null && user.onboarding_step !== undefined && user.onboarding_step < 3) {
    return <Navigate to="/onboarding" replace />
  }
  return children
}

/** Solo permite aliados que NO han completado el onboarding */
export function OnboardingRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>Cargando...</div>
  if (!user || user.tipo !== 'aliado') return <Navigate to="/login" replace />
  if (user.onboarding_step === null || user.onboarding_step === undefined || user.onboarding_step >= 3) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}
