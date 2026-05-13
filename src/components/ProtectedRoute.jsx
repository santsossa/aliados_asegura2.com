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

/** Solo permite aliados */
export function AliasRoute({ children }) {
  const { isAuth, isAliado, loading } = useAuth()
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>Cargando...</div>
  if (!isAuth) return <Navigate to="/login" replace />
  if (!isAliado) return <Navigate to="/admin" replace />
  return children
}
