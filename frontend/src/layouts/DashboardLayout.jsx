import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Home, FileText, ShieldCheck, Wallet, Calculator,
  AlignJustify, X, LogOut, Sparkles, Settings, Headphones,
} from 'lucide-react'
import { LogoIcon } from '../components/Logo'
import { useIsMobile } from '../hooks/use-mobile'
import { useAuth } from '../context/AuthContext'
import { SSEProvider } from '../context/SSEContext'
import NotificationBell from '../components/NotificationBell'
import IAAssistant from '../components/IAAssistant'

const NAV_MAIN = [
  { to: '/dashboard',              icon: Home,        label: 'Inicio'       },
  { to: '/dashboard/cotizaciones', icon: FileText,    label: 'Cotizaciones' },
  { to: '/dashboard/mis-polizas',  icon: ShieldCheck, label: 'Mis pólizas'  },
  { to: '/dashboard/mis-pagos',    icon: Wallet,      label: 'Comisiones'   },
  { to: '/dashboard/cotizar',      icon: Calculator,  label: 'Cotizar'      },
]

const NAV_CONFIG = {
  to: '/dashboard/informacion-financiera',
  icon: Settings,
  label: 'Configuración',
}

// ── Estilos reutilizables ───────────────────────────────────────────────────
// Activo: gris suave con texto/icono en morado de marca (visible, no negro)
const ACTIVE_BG   = '#edeef3'
const ACTIVE_TEXT = '#2D2A7A'
const HOVER_BG    = '#f3f4f6'

const navItemStyle = (isActive) => ({
  display: 'flex', alignItems: 'center', gap: 10,
  height: 38, padding: '0 8px', borderRadius: 9,
  textDecoration: 'none', fontWeight: 600, fontSize: 13.5,
  color: isActive ? ACTIVE_TEXT : '#374151',
  background: isActive ? ACTIVE_BG : 'transparent',
  transition: 'background 0.13s, color 0.13s',
  overflow: 'hidden', whiteSpace: 'nowrap', flexShrink: 0,
  border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
})

// No aplica hover si el ítem ya está activo (edeef3 en background)
const hoverOn  = e => { if (!e.currentTarget.style.background.includes('edeef3')) e.currentTarget.style.background = HOVER_BG }
const hoverOff = e => { if (!e.currentTarget.style.background.includes('edeef3')) e.currentTarget.style.background = 'transparent' }

// Línea divisoria centrada en el eje X del sidebar
function Divider() {
  return (
    <div style={{ display:'flex', justifyContent:'center', margin:'5px 0' }}>
      <div style={{ width:'65%', borderTop:'1px solid #e5e7eb' }} />
    </div>
  )
}

// Nav item ícono + texto (para la sección colapsable del sidebar desktop)
function NavIcon({ icon: Icon, isActive }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 26 }}>
      <Icon size={17} color={isActive ? ACTIVE_TEXT : '#6b7280'} />
    </span>
  )
}
function NavLabel({ label, sideOpen }) {
  return (
    <span style={{ opacity: sideOpen ? 1 : 0, maxWidth: sideOpen ? 140 : 0, overflow: 'hidden', transition: 'opacity 0.2s ease, max-width 0.25s ease' }}>
      {label}
    </span>
  )
}

// Perfil del usuario
function UserProfile({ user, sideOpen }) {
  const nombre   = user?.nombre   || ''
  const apellido = user?.apellido || ''
  const initials = (nombre[0] || '') + (apellido[0] || nombre[1] || '')
  const display  = nombre || user?.email?.split('@')[0] || 'Aliado'
  const correo   = user?.correo || user?.email || ''
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', overflow: 'hidden' }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#2D2A7A)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', textTransform: 'uppercase', lineHeight: 1 }}>
          {initials || '?'}
        </span>
      </div>
      <div style={{ opacity: sideOpen ? 1 : 0, maxWidth: sideOpen ? 130 : 0, overflow: 'hidden', whiteSpace: 'nowrap', transition: 'opacity 0.2s ease, max-width 0.25s ease', minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{display}</p>
        <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', lineHeight: 1.3, marginTop: 1 }}>{correo}</p>
      </div>
    </div>
  )
}

export default function DashboardLayout() {
  const navigate             = useNavigate()
  const isMobile             = useIsMobile()
  const { logout, user }     = useAuth()
  const [sideOpen, setSideOpen]   = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const sidebarW = sideOpen ? 200 : 60

  // ── MÓVIL ─────────────────────────────────────────────────────────────────
  if (isMobile) {
    const nombre   = user?.nombre   || ''
    const apellido = user?.apellido || ''
    const initials = (nombre[0] || '') + (apellido[0] || nombre[1] || '')
    const display  = nombre || user?.email?.split('@')[0] || 'Aliado'
    const correo   = user?.correo || user?.email || ''

    return (
      <SSEProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Topbar */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 56, background: '#fff', borderBottom: '1px solid #eeeeef', flexShrink: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogoIcon size={26} />
            <div style={{ lineHeight: '16px' }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#16151b', margin: 0 }}>Asegura2.com</p>
              <p style={{ fontWeight: 400, fontSize: 10, color: '#a2a8c0', margin: 0 }}>Portal de aliados</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NotificationBell />
            <button
              onClick={() => setDrawerOpen(true)}
              style={{ width: 36, height: 36, borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <AlignJustify size={18} color="#374151" />
            </button>
          </div>
        </header>

        {/* Contenido principal */}
        <main style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
          <Outlet />
        </main>

        {/* Drawer lateral */}
        {drawerOpen && (
          <>
            <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 310 }} />
            <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 272, background: '#fff', zIndex: 320, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>

              {/* Drawer header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #f0f0f2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <LogoIcon size={22} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#16151b' }}>Asegura2.com</span>
                </div>
                <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              {/* Nav items */}
              <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Nav principal */}
                {NAV_MAIN.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to} to={to}
                    end={to === '/dashboard'}
                    onClick={() => setDrawerOpen(false)}
                    style={({ isActive }) => ({ ...navItemStyle(isActive), marginBottom: 2 })}
                    onMouseEnter={hoverOn} onMouseLeave={hoverOff}
                  >
                    {({ isActive }) => (
                      <>
                        <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:26 }}>
                          <Icon size={17} color={isActive ? '#fff' : '#6b7280'} />
                        </span>
                        <span>{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}

                <Divider />

                {/* Anto IA — morado igual que desktop */}
                <button
                  onClick={() => { setDrawerOpen(false); document.querySelector('[data-anto-pill]')?.click() }}
                  style={{
                    display:'flex', alignItems:'center', gap:10, height:38, padding:'0 8px', borderRadius:9, border:'none',
                    background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', color:'#4f46e5',
                    fontWeight:700, fontSize:13.5, cursor:'pointer', width:'100%', overflow:'hidden',
                    whiteSpace:'nowrap', transition:'background 0.15s', flexShrink:0, textAlign:'left', marginBottom:2,
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background='linear-gradient(135deg,#ddd6fe,#c4b5fd)'}
                  onMouseLeave={e=>e.currentTarget.style.background='linear-gradient(135deg,#ede9fe,#ddd6fe)'}
                >
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:26 }}>
                    <Sparkles size={17} color="#4f46e5" />
                  </span>
                  <span>Anto IA</span>
                </button>

                <Divider />

                {/* Soporte */}
                <button
                  onClick={() => window.open('mailto:soporte@asegura2.com', '_blank')}
                  style={{ ...navItemStyle(false), marginBottom: 2 }}
                  onMouseEnter={hoverOn} onMouseLeave={hoverOff}
                >
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:26 }}>
                    <Headphones size={17} color="#6b7280" />
                  </span>
                  <span>Soporte</span>
                </button>

                {/* Configuración */}
                <NavLink
                  to={NAV_CONFIG.to}
                  onClick={() => setDrawerOpen(false)}
                  style={({ isActive }) => ({ ...navItemStyle(isActive), marginBottom: 2 })}
                  onMouseEnter={hoverOn} onMouseLeave={hoverOff}
                >
                  {({ isActive }) => (
                    <>
                      <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:26 }}>
                        <Settings size={17} color={isActive ? '#fff' : '#6b7280'} />
                      </span>
                      <span>Configuración</span>
                    </>
                  )}
                </NavLink>
              </nav>

              {/* Perfil + logout */}
              <div style={{ padding: '10px', borderTop: '1px solid #f0f0f2' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 8px 10px' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#2D2A7A)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:12, fontWeight:800, color:'#fff', textTransform:'uppercase' }}>{initials || '?'}</span>
                  </div>
                  <div style={{ minWidth:0 }}>
                    <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#111827' }}>{display}</p>
                    <p style={{ margin:0, fontSize:11, color:'#9ca3af' }}>{correo}</p>
                  </div>
                </div>
                {/* Cerrar sesión — solo hover rojo */}
                <button
                  onClick={() => { logout(); navigate('/login') }}
                  style={{
                    display:'flex', alignItems:'center', gap:10, height:38, padding:'0 8px', borderRadius:9,
                    border:'none', background:'transparent', color:'#ef4444',
                    fontWeight:600, fontSize:13.5, cursor:'pointer', width:'100%',
                    overflow:'hidden', whiteSpace:'nowrap', transition:'background 0.13s',
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:26 }}>
                    <LogOut size={17} color="#ef4444" />
                  </span>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <IAAssistant />
      </SSEProvider>
    )
  }

  // ── TABLET / DESKTOP ───────────────────────────────────────────────────────
  return (
    <SSEProvider>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ flex: 1, padding: '6px', overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `${sidebarW}px 1fr`,
          border: '2px solid #eeeeef',
          borderRadius: 28, height: '100%', overflow: 'hidden',
          transition: 'grid-template-columns 0.25s cubic-bezier(0.4,0,0.2,1)',
          background: '#fff',
        }}>

          {/* Sidebar */}
          <aside style={{ width: sidebarW, height: '100%', background: '#fff', borderRadius: 28, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
            <nav style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>

              {/* Toggle */}
              <div style={{ paddingBottom: 14, paddingLeft: 4 }}>
                <button
                  onClick={() => setSideOpen(v => !v)}
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = HOVER_BG}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <AlignJustify size={18} color="#6b7280" />
                </button>
              </div>

              {/* Nav principal */}
              {NAV_MAIN.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} end={to === '/dashboard'}
                  style={({ isActive }) => ({ ...navItemStyle(isActive), marginBottom: 2 })}
                  onMouseEnter={hoverOn} onMouseLeave={hoverOff}
                >
                  {({ isActive }) => (
                    <>
                      <NavIcon icon={Icon} isActive={isActive} />
                      <NavLabel label={label} sideOpen={sideOpen} />
                    </>
                  )}
                </NavLink>
              ))}

              <Divider />

              {/* Anto IA — destaque morado */}
              <button
                data-anto-trigger
                onClick={() => document.querySelector('[data-anto-pill]')?.click()}
                style={{
                  display:'flex', alignItems:'center', gap:10, height:38, padding:'0 8px', borderRadius:9, border:'none',
                  background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', color:'#4f46e5',
                  fontWeight:700, fontSize:13.5, cursor:'pointer', width:'100%', overflow:'hidden',
                  whiteSpace:'nowrap', transition:'background 0.15s', flexShrink:0, textAlign:'left', marginBottom:2,
                }}
                onMouseEnter={e=>e.currentTarget.style.background='linear-gradient(135deg,#ddd6fe,#c4b5fd)'}
                onMouseLeave={e=>e.currentTarget.style.background='linear-gradient(135deg,#ede9fe,#ddd6fe)'}
              >
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:26 }}>
                  <Sparkles size={17} color="#4f46e5" />
                </span>
                <NavLabel label="Anto IA" sideOpen={sideOpen} />
              </button>
            </nav>

            {/* Sección inferior */}
            <div style={{ padding: '8px' }}>

              {/* Soporte */}
              <button
                onClick={() => window.open('mailto:soporte@asegura2.com', '_blank')}
                style={{ ...navItemStyle(false), marginBottom: 2 }}
                onMouseEnter={hoverOn} onMouseLeave={hoverOff}
              >
                <NavIcon icon={Headphones} isActive={false} />
                <NavLabel label="Soporte" sideOpen={sideOpen} />
              </button>

              {/* Configuración */}
              <NavLink to={NAV_CONFIG.to}
                style={({ isActive }) => ({ ...navItemStyle(isActive), marginBottom: 2 })}
                onMouseEnter={hoverOn} onMouseLeave={hoverOff}
              >
                {({ isActive }) => (
                  <>
                    <NavIcon icon={Settings} isActive={isActive} />
                    <NavLabel label="Configuración" sideOpen={sideOpen} />
                  </>
                )}
              </NavLink>

              {/* Separador antes del perfil */}
              <Divider />

              {/* Perfil */}
              <UserProfile user={user} sideOpen={sideOpen} />

              {/* Cerrar sesión — solo hover rojo, sin estados oscuros */}
              <button
                onClick={() => { logout(); navigate('/login') }}
                style={{
                  display:'flex', alignItems:'center', gap:10, height:38, padding:'0 8px', borderRadius:9,
                  border:'none', background:'transparent', color:'#ef4444',
                  fontWeight:600, fontSize:13.5, cursor:'pointer', width:'100%',
                  overflow:'hidden', whiteSpace:'nowrap', transition:'background 0.13s',
                  flexShrink:0, textAlign:'left', marginTop:2,
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:26 }}>
                  <LogOut size={17} color="#ef4444" />
                </span>
                <NavLabel label="Cerrar sesión" sideOpen={sideOpen} />
              </button>
            </div>
          </aside>

          {/* Contenido principal */}
          <main style={{ background: '#eeeeef', borderRadius: 24, overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 64, background: '#eeeeef', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <LogoIcon size={30} />
                <div style={{ lineHeight: '17px' }}>
                  <p style={{ fontWeight: 600, fontSize: 16, color: '#16151b', margin: 0 }}>Asegura2.com</p>
                  <p style={{ fontWeight: 400, fontSize: 11, color: '#a2a8c0', margin: 0 }}>Portal de aliados</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <NotificationBell />
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
    <IAAssistant />
    </SSEProvider>
  )
}
