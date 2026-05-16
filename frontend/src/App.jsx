import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, AdminRoute, AliasRoute, OnboardingRoute } from './components/ProtectedRoute'

// Public
import Landing            from './pages/Landing'
import Login              from './pages/auth/Login'
import Otp                from './pages/auth/Otp'
import Registro           from './pages/auth/Registro'
import VerificarRegistro  from './pages/auth/VerificarRegistro'
import VerificarCorreo    from './pages/auth/VerificarCorreo'

// Onboarding
import Onboarding from './pages/onboarding/Onboarding'

// Dashboard aliado
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard       from './pages/dashboard/Dashboard'
import Cotizaciones    from './pages/dashboard/Cotizaciones'
import Cotizar         from './pages/dashboard/Cotizar'
import MisPolizas      from './pages/dashboard/MisPolizas'
import MisPagos        from './pages/dashboard/MisPagos'
import InfoFinanciera  from './pages/dashboard/InfoFinanciera'

// Admin panel
import AdminLayout        from './layouts/AdminLayout'
import AdminDashboard     from './pages/admin/AdminDashboard'
import AdminAliados       from './pages/admin/AdminAliados'
import AdminLeads         from './pages/admin/AdminLeads'
import AdminPolizas       from './pages/admin/AdminPolizas'
import AdminLiquidaciones from './pages/admin/AdminLiquidaciones'
import AdminReportes      from './pages/admin/AdminReportes'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Públicas ─────────────────────────────────── */}
          <Route path="/"                      element={<Landing />} />
          <Route path="/login"                 element={<Login />} />
          <Route path="/login/otp"             element={<Otp />} />
          <Route path="/registro"              element={<Registro />} />
          <Route path="/registro/verificar"    element={<VerificarRegistro />} />
          <Route path="/verificar-correo"      element={<VerificarCorreo />} />

          {/* ── Onboarding ───────────────────────────────── */}
          <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />

          {/* ── Dashboard aliado ─────────────────────────── */}
          <Route path="/dashboard" element={<AliasRoute><DashboardLayout /></AliasRoute>}>
            <Route index                          element={<Dashboard />} />
            <Route path="cotizar"                 element={<Cotizar />} />
            <Route path="cotizaciones"            element={<Cotizaciones />} />
            <Route path="mis-polizas"             element={<MisPolizas />} />
            <Route path="mis-pagos"               element={<MisPagos />} />
            <Route path="informacion-financiera"  element={<InfoFinanciera />} />
          </Route>

          {/* ── Panel admin ──────────────────────────────── */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index                          element={<AdminDashboard />} />
            <Route path="aliados"                 element={<AdminAliados />} />
            <Route path="leads"                   element={<AdminLeads />} />
            <Route path="polizas"                 element={<AdminPolizas />} />
            <Route path="liquidaciones"           element={<AdminLiquidaciones />} />
            <Route path="reportes"                element={<AdminReportes />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
