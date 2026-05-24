import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import {
  Home, FileText, ShieldCheck, Wallet, Calculator,
  X, LogOut, Sparkles, Settings, Headphones, AlignJustify,
  ChevronLeft, ChevronRight, Search,
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

const ACTIVE_BG   = '#edeef3'
const ACTIVE_TEXT = '#2D2A7A'
const HOVER_BG    = '#f3f4f6'
const PAGE_BG     = '#f5f7fb'

const navItemStyle = (isActive) => ({
  display: 'flex', alignItems: 'center', gap: 10,
  height: 40, padding: '0 8px', borderRadius: 9,
  textDecoration: 'none', fontWeight: 600, fontSize: 13.5,
  color: isActive ? ACTIVE_TEXT : '#374151',
  background: isActive ? ACTIVE_BG : 'transparent',
  transition: 'background 0.13s, color 0.13s',
  overflow: 'hidden', whiteSpace: 'nowrap', flexShrink: 0,
  border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
})

const hoverOn  = e => { if (!e.currentTarget.style.background.includes('edeef3')) e.currentTarget.style.background = HOVER_BG }
const hoverOff = e => { if (!e.currentTarget.style.background.includes('edeef3')) e.currentTarget.style.background = 'transparent' }

function Divider() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '7px 0' }}>
      <div style={{ width: '90%', borderTop: '1px solid #e5e7eb' }} />
    </div>
  )
}

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

function UserProfile({ user, sideOpen }) {
  const nombre   = user?.nombre   || ''
  const apellido = user?.apellido || ''
  const initials = (nombre[0] || '') + (apellido[0] || nombre[1] || '')
  const display  = nombre || user?.email?.split('@')[0] || 'Aliado'
  const correo   = user?.correo || user?.email || ''
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 8px', overflow: 'hidden' }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#2D2A7A)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', textTransform: 'uppercase', lineHeight: 1 }}>
          {initials || '?'}
        </span>
      </div>
      <div style={{ opacity: sideOpen ? 1 : 0, maxWidth: sideOpen ? 145 : 0, overflow: 'hidden', transition: 'opacity 0.2s ease, max-width 0.25s ease', minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{display}</p>
        <p style={{ margin: 0, fontSize: 10.5, color: '#9ca3af', lineHeight: 1.35, marginTop: 2, wordBreak: 'break-all' }}>{correo}</p>
      </div>
    </div>
  )
}

// ── Search bar with dropdown ────────────────────────────────────────────────
function TopbarSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  function handleKey(e) {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/dashboard/cotizaciones?q=${encodeURIComponent(query.trim())}`)
      setFocused(false)
      inputRef.current?.blur()
    }
    if (e.key === 'Escape') {
      setFocused(false)
      inputRef.current?.blur()
    }
  }

  const suggestions = [
    { label: 'Cotizaciones del mes', sub: 'Ver todas las cotizaciones activas', to: '/dashboard/cotizaciones' },
    { label: 'Enviadas a emitir',    sub: 'Pólizas en proceso de emisión',      to: '/dashboard/mis-polizas?estado=en_proceso' },
    { label: 'Pólizas aprobadas',    sub: 'Pólizas ya aprobadas',               to: '/dashboard/mis-polizas?estado=aprobada' },
    { label: 'Mis comisiones',       sub: 'Historial de pagos y comisiones',     to: '/dashboard/mis-pagos' },
  ]

  return (
    <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        height: 38, padding: '0 14px',
        background: '#fff',
        borderRadius: 999,
        border: `1.5px solid ${focused ? '#4f46e5' : '#e5e7eb'}`,
        transition: 'border-color 0.15s',
      }}>
        <Search size={15} color={focused ? '#4f46e5' : '#9ca3af'} style={{ flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKey}
          placeholder="Buscar cliente, placa, póliza..."
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 13, color: '#111827',
          }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, color: '#9ca3af' }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {focused && (
        <div style={{
          position: 'absolute', top: 44, left: 0, right: 0,
          background: '#fff', borderRadius: 14,
          border: '1px solid #e5e7eb',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          zIndex: 200, overflow: 'hidden',
        }}>
          <p style={{ margin: 0, padding: '10px 14px 6px', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {query ? `Buscar "${query}"` : 'Accesos rápidos'}
          </p>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onMouseDown={() => navigate(s.to)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                width: '100%', padding: '9px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: i < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.label}</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{s.sub}</span>
            </button>
          ))}
          {query && (
            <button
              onMouseDown={() => { navigate(`/dashboard/cotizaciones?q=${encodeURIComponent(query.trim())}`); setFocused(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '10px 14px',
                background: '#f5f3ff', border: 'none', cursor: 'pointer',
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <Search size={13} color="#4f46e5" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#4f46e5' }}>Buscar "{query}" en cotizaciones</span>
            </button>
          )}
        </div>
      )}
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

        {/* Topbar móvil */}
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

        <main style={{ flex: 1, overflowY: 'auto', background: PAGE_BG }}>
          <Outlet />
        </main>

        {/* Drawer lateral */}
        {drawerOpen && (
          <>
            <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 310 }} />
            <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 272, background: '#fff', zIndex: 320, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #f0f0f2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <LogoIcon size={22} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#16151b' }}>Asegura2.com</span>
                </div>
                <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>
              <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {NAV_MAIN.map(({ to, icon: Icon, label }) => (
                  <NavLink key={to} to={to} end={to === '/dashboard'}
                    onClick={() => setDrawerOpen(false)}
                    style={({ isActive }) => ({ ...navItemStyle(isActive), marginBottom: 2 })}
                    onMouseEnter={hoverOn} onMouseLeave={hoverOff}
                  >
                    {({ isActive }) => (
                      <>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 26 }}>
                          <Icon size={17} color={isActive ? ACTIVE_TEXT : '#6b7280'} />
                        </span>
                        <span>{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
                <Divider />
                <button
                  onClick={() => { setDrawerOpen(false); document.querySelector('[data-anto-pill]')?.click() }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, height: 38, padding: '0 8px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', color: '#4f46e5', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', flexShrink: 0, textAlign: 'left', marginBottom: 4 }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 26 }}>
                    <Sparkles size={17} color="#4f46e5" />
                  </span>
                  <span>Anto IA</span>
                </button>
                <Divider />
                <button onClick={() => window.open('mailto:soporte@asegura2.com', '_blank')} style={{ ...navItemStyle(false), marginBottom: 4 }} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 26 }}><Headphones size={17} color="#6b7280" /></span>
                  <span>Soporte</span>
                </button>
                <NavLink to={NAV_CONFIG.to} onClick={() => setDrawerOpen(false)} style={({ isActive }) => ({ ...navItemStyle(isActive), marginBottom: 2 })} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                  {({ isActive }) => (
                    <>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 26 }}><Settings size={17} color={isActive ? ACTIVE_TEXT : '#6b7280'} /></span>
                      <span>Configuración</span>
                    </>
                  )}
                </NavLink>
              </nav>
              <div style={{ padding: '10px', borderTop: '1px solid #f0f0f2' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 8px 10px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#2D2A7A)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>{initials || '?'}</span>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{display}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', wordBreak: 'break-all', lineHeight: 1.35 }}>{correo}</p>
                  </div>
                </div>
                <button
                  onClick={() => { logout(); navigate('/login') }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, height: 38, padding: '0 8px', borderRadius: 9, border: 'none', background: 'transparent', color: '#ef4444', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', transition: 'background 0.13s', marginTop: 10 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 26 }}><LogOut size={17} color="#ef4444" /></span>
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

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <aside style={{ width: sidebarW, height: '100%', background: '#fff', borderRadius: 28, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)' }}>

            {/* Logo + toggle button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 8px 10px 12px', borderBottom: '1px solid #f0f0f2', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', minWidth: 0 }}>
                <LogoIcon size={26} style={{ flexShrink: 0 }} />
                <div style={{ opacity: sideOpen ? 1 : 0, maxWidth: sideOpen ? 120 : 0, overflow: 'hidden', transition: 'opacity 0.2s ease, max-width 0.25s ease', whiteSpace: 'nowrap' }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#16151b', margin: 0, lineHeight: '15px' }}>Asegura2.com</p>
                  <p style={{ fontWeight: 400, fontSize: 9.5, color: '#a2a8c0', margin: 0 }}>Portal de aliados</p>
                </div>
              </div>
              <button
                onClick={() => setSideOpen(v => !v)}
                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fb', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = HOVER_BG}
                onMouseLeave={e => e.currentTarget.style.background = '#f5f7fb'}
              >
                {sideOpen
                  ? <ChevronLeft size={14} color="#6b7280" />
                  : <ChevronRight size={14} color="#6b7280" />
                }
              </button>
            </div>

            <nav style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
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

              <button
                data-anto-trigger
                onClick={() => document.querySelector('[data-anto-pill]')?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: 10, height: 38, padding: '0 8px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', color: '#4f46e5', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', transition: 'background 0.15s', flexShrink: 0, textAlign: 'left', marginBottom: 4 }}
                onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg,#ddd6fe,#c4b5fd)'}
                onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg,#ede9fe,#ddd6fe)'}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 26 }}>
                  <Sparkles size={17} color="#4f46e5" />
                </span>
                <NavLabel label="Anto IA" sideOpen={sideOpen} />
              </button>
            </nav>

            {/* Sección inferior */}
            <div style={{ padding: '8px' }}>
              <button onClick={() => window.open('mailto:soporte@asegura2.com', '_blank')} style={{ ...navItemStyle(false), marginBottom: 4 }} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                <NavIcon icon={Headphones} isActive={false} />
                <NavLabel label="Soporte" sideOpen={sideOpen} />
              </button>

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

              <Divider />

              <UserProfile user={user} sideOpen={sideOpen} />

              <button
                onClick={() => { logout(); navigate('/login') }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, height: 38, padding: '0 8px', borderRadius: 9, border: 'none', background: 'transparent', color: '#ef4444', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', transition: 'background 0.13s', flexShrink: 0, textAlign: 'left', marginTop: 10 }}
                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 26 }}>
                  <LogOut size={17} color="#ef4444" />
                </span>
                <NavLabel label="Cerrar sesión" sideOpen={sideOpen} />
              </button>
            </div>
          </aside>

          {/* ── Contenido principal ───────────────────────────────────────── */}
          <main style={{ background: PAGE_BG, borderRadius: 24, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* Topbar: buscador + notificaciones + perfil */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: 64, background: PAGE_BG, flexShrink: 0, gap: 14 }}>
              <TopbarSearch />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <NotificationBell />
                <div style={{ width: 1, height: 28, background: '#e5e7eb' }} />
                {/* User profile chip */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 6px', background: '#fff', borderRadius: 999, border: '1px solid #e5e7eb', cursor: 'default' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#2D2A7A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
                      {((user?.nombre?.[0] || '') + (user?.apellido?.[0] || user?.nombre?.[1] || '')).toUpperCase() || '?'}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                    {user?.nombre || user?.email?.split('@')[0] || 'Aliado'}
                  </span>
                </div>
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
