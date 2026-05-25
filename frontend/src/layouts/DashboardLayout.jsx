import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Home, FileText, ShieldCheck, Wallet, Calculator,
  AlignJustify, X, LogOut, Sparkles, Settings, Headphones, Search, ChevronLeft,
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

const navItemStyle = (isActive, sideOpen = true) => ({
  display: 'flex', alignItems: 'center',
  justifyContent: sideOpen ? 'flex-start' : 'center',
  gap: sideOpen ? 10 : 0, height: 40,
  padding: sideOpen ? '0 8px' : '0',
  borderRadius: 9,
  textDecoration: 'none', fontFamily: 'Poppins', fontWeight: 500, fontSize: 14, letterSpacing: '0.01em',
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
    <div style={{ display:'flex', justifyContent:'center', margin:'7px 0' }}>
      <div style={{ width:'90%', borderTop:'1px solid #e5e7eb' }} />
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

// Tooltip via portal — escapa el overflow:hidden del sidebar
function SideTooltip({ label, sideOpen, children }) {
  const ref  = useRef(null)
  const [pos, setPos] = useState(null)

  const show = (e) => {
    if (sideOpen) return
    const r = (ref.current || e.currentTarget).getBoundingClientRect()
    setPos({ top: r.top + r.height / 2, left: r.right + 10 })
  }
  const hide = () => setPos(null)

  return (
    <div ref={ref} onMouseEnter={show} onMouseLeave={hide} style={{ position: 'relative' }}>
      {children}
      {pos && createPortal(
        <div style={{
          position: 'fixed', top: pos.top, left: pos.left,
          transform: 'translateY(-50%)',
          background: '#1f2937', color: '#fff',
          padding: '5px 11px', borderRadius: 7,
          fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
          zIndex: 9999, pointerEvents: 'none',
          boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
        }}>
          {label}
        </div>,
        document.body
      )}
    </div>
  )
}

export default function DashboardLayout() {
  const navigate                    = useNavigate()
  const isMobile                    = useIsMobile()
  const { logout, user }            = useAuth()
  const [sideOpen, setSideOpen]     = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [logoHover, setLogoHover]   = useState(false)
  const sideRef                     = useRef(null)

  const nombre   = user?.nombre   || ''
  const apellido = user?.apellido || ''
  const initials = ((nombre[0] || '') + (apellido[0] || nombre[1] || '')).toUpperCase()
  const display  = nombre || user?.email?.split('@')[0] || 'Aliado'
  const correo   = user?.correo || user?.email || ''

  // Cerrar sidebar al hacer clic fuera
  useEffect(() => {
    if (!sideOpen || isMobile) return
    const handler = (e) => {
      if (sideRef.current && !sideRef.current.contains(e.target)) setSideOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sideOpen, isMobile])

  const sidebarW = sideOpen ? 200 : 60

  // ── MÓVIL ─────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <SSEProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#fff' }}>

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
            <button onClick={() => setDrawerOpen(true)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlignJustify size={18} color="#374151" />
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
          <Outlet />
        </main>

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
              <nav style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {NAV_MAIN.map(({ to, icon: Icon, label }) => (
                  <NavLink key={to} to={to} end={to === '/dashboard'} onClick={() => setDrawerOpen(false)}
                    style={({ isActive }) => ({ ...navItemStyle(isActive), marginBottom: 2 })}
                    onMouseEnter={hoverOn} onMouseLeave={hoverOff}
                  >
                    {({ isActive }) => (<><span style={{ display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,width:26 }}><Icon size={17} color={isActive?ACTIVE_TEXT:'#6b7280'}/></span><span>{label}</span></>)}
                  </NavLink>
                ))}
                <Divider />
                <button onClick={() => { setDrawerOpen(false); document.querySelector('[data-anto-pill]')?.click() }}
                  style={{ display:'flex',alignItems:'center',gap:10,height:38,padding:'0 8px',borderRadius:9,border:'none',background:'linear-gradient(135deg,#ede9fe,#ddd6fe)',color:'#4f46e5',fontWeight:700,fontSize:13.5,cursor:'pointer',width:'100%',overflow:'hidden',whiteSpace:'nowrap',transition:'background 0.15s',flexShrink:0,textAlign:'left',marginBottom:4 }}
                  onMouseEnter={e=>e.currentTarget.style.background='linear-gradient(135deg,#ddd6fe,#c4b5fd)'}
                  onMouseLeave={e=>e.currentTarget.style.background='linear-gradient(135deg,#ede9fe,#ddd6fe)'}
                >
                  <span style={{ display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,width:26 }}><Sparkles size={17} color="#4f46e5"/></span>
                  <span>Anto IA</span>
                </button>
                <Divider />
                <button onClick={() => window.open('mailto:soporte@asegura2.com','_blank')} style={{ ...navItemStyle(false), marginBottom:4 }} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                  <span style={{ display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,width:26 }}><Headphones size={17} color="#6b7280"/></span><span>Soporte</span>
                </button>
                <NavLink to={NAV_CONFIG.to} onClick={() => setDrawerOpen(false)} style={({ isActive }) => ({ ...navItemStyle(isActive), marginBottom:2 })} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                  {({ isActive }) => (<><span style={{ display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,width:26 }}><Settings size={17} color={isActive?ACTIVE_TEXT:'#6b7280'}/></span><span>Configuración</span></>)}
                </NavLink>
              </nav>
              <div style={{ padding:'10px', borderTop:'1px solid #f0f0f2' }}>
                <div style={{ display:'flex',alignItems:'flex-start',gap:10,padding:'6px 8px 10px' }}>
                  <div style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#4f46e5,#2D2A7A)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',marginTop:2 }}>
                    <span style={{ fontSize:12,fontWeight:800,color:'#fff',textTransform:'uppercase' }}>{initials||'?'}</span>
                  </div>
                  <div style={{ minWidth:0,flex:1 }}>
                    <p style={{ margin:0,fontSize:13,fontWeight:700,color:'#111827',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{display}</p>
                    <p style={{ margin:0,fontSize:11,color:'#9ca3af',wordBreak:'break-all',lineHeight:1.35 }}>{correo}</p>
                  </div>
                </div>
                <button onClick={() => { logout(); navigate('/login') }} style={{ display:'flex',alignItems:'center',gap:10,height:38,padding:'0 8px',borderRadius:9,border:'none',background:'transparent',color:'#ef4444',fontWeight:600,fontSize:13.5,cursor:'pointer',width:'100%',overflow:'hidden',whiteSpace:'nowrap',transition:'background 0.13s',marginTop:10 }} onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <span style={{ display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,width:26 }}><LogOut size={17} color="#ef4444"/></span>
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

  // ── DESKTOP / TABLET ───────────────────────────────────────────────────────
  return (
    <SSEProvider>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff' }}>
      <div style={{ flex: 1, padding: '6px', overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: `${sidebarW}px 1fr`,
          border: '2px solid #eeeeef', borderRadius: 28, height: '100%', overflow: 'hidden',
          transition: 'grid-template-columns 0.25s cubic-bezier(0.4,0,0.2,1)',
          background: '#fff',
        }}>

          {/* ── Sidebar ── */}
          <aside ref={sideRef} style={{ width: sidebarW, height: '100%', background: '#fff', borderRadius: 28, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)' }}>

            {/* Logo + colapsar */}
            <div
              onMouseEnter={() => setLogoHover(true)}
              onMouseLeave={() => setLogoHover(false)}
              onClick={() => !sideOpen && setSideOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', height: 56,
                padding: sideOpen ? '0 6px 0 12px' : '0',
                justifyContent: sideOpen ? 'flex-start' : 'center',
                borderBottom: '1px solid #f0f0f2', flexShrink: 0, overflow: 'hidden',
                cursor: !sideOpen ? 'pointer' : 'default',
                transition: 'padding 0.25s ease',
              }}
            >
              <div style={{ width: 26, height: 26, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!sideOpen && logoHover) ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                {(!sideOpen && logoHover) ? <AlignJustify size={20} color="#2D2A7A" /> : <LogoIcon size={26} />}
              </div>
              <div style={{ opacity: sideOpen ? 1 : 0, maxWidth: sideOpen ? 120 : 0, overflow: 'hidden', transition: 'opacity 0.2s ease, max-width 0.25s ease', whiteSpace: 'nowrap', marginLeft: sideOpen ? 8 : 0, flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#16151b', margin: 0, lineHeight: '15px' }}>Asegura2.com</p>
                <p style={{ fontWeight: 400, fontSize: 9.5, color: '#a2a8c0', margin: 0 }}>Portal de aliados</p>
              </div>
              {sideOpen && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSideOpen(false) }}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:8, flexShrink:0, background: logoHover ? '#f3f4f6' : 'transparent', border:'none', cursor:'pointer', opacity: logoHover ? 1 : 0, transition:'background 0.15s, opacity 0.2s' }}
                >
                  <ChevronLeft size={16} color="#6b7280" />
                </button>
              )}
            </div>

            {/* Nav principal */}
            <nav style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              {NAV_MAIN.map(({ to, icon: Icon, label }) => (
                <SideTooltip key={to} label={label} sideOpen={sideOpen}>
                  <NavLink to={to} end={to === '/dashboard'}
                    onClick={() => setSideOpen(false)}
                    style={({ isActive }) => ({ ...navItemStyle(isActive, sideOpen), marginBottom: 2 })}
                    onMouseEnter={hoverOn} onMouseLeave={hoverOff}
                  >
                    {({ isActive }) => (<><NavIcon icon={Icon} isActive={isActive} /><NavLabel label={label} sideOpen={sideOpen} /></>)}
                  </NavLink>
                </SideTooltip>
              ))}

              <Divider />

              <SideTooltip label="Anto IA" sideOpen={sideOpen}>
                <button
                  data-anto-trigger
                  onClick={() => { setSideOpen(false); document.querySelector('[data-anto-pill]')?.click() }}
                  style={{ display:'flex', alignItems:'center', justifyContent: sideOpen ? 'flex-start' : 'center', gap: sideOpen ? 10 : 0, height:38, padding: sideOpen ? '0 8px' : '0', borderRadius:9, border:'none', background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', color:'#4f46e5', fontWeight:700, fontSize:13.5, cursor:'pointer', width:'100%', overflow:'hidden', whiteSpace:'nowrap', transition:'background 0.15s, padding 0.25s', flexShrink:0, textAlign:'left', marginBottom:4 }}
                  onMouseEnter={e=>e.currentTarget.style.background='linear-gradient(135deg,#ddd6fe,#c4b5fd)'}
                  onMouseLeave={e=>e.currentTarget.style.background='linear-gradient(135deg,#ede9fe,#ddd6fe)'}
                >
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:26 }}><Sparkles size={17} color="#4f46e5" /></span>
                  <NavLabel label="Anto IA" sideOpen={sideOpen} />
                </button>
              </SideTooltip>
            </nav>

            {/* Sección inferior */}
            <div style={{ padding: '8px', flexShrink: 0 }}>
              <SideTooltip label="Soporte" sideOpen={sideOpen}>
                <button onClick={() => { setSideOpen(false); window.open('mailto:soporte@asegura2.com','_blank') }}
                  style={{ ...navItemStyle(false, sideOpen), marginBottom: 4 }} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                  <NavIcon icon={Headphones} isActive={false} />
                  <NavLabel label="Soporte" sideOpen={sideOpen} />
                </button>
              </SideTooltip>

              <SideTooltip label="Configuración" sideOpen={sideOpen}>
                <NavLink to={NAV_CONFIG.to} onClick={() => setSideOpen(false)}
                  style={({ isActive }) => ({ ...navItemStyle(isActive, sideOpen), marginBottom: 2 })}
                  onMouseEnter={hoverOn} onMouseLeave={hoverOff}
                >
                  {({ isActive }) => (<><NavIcon icon={Settings} isActive={isActive} /><NavLabel label="Configuración" sideOpen={sideOpen} /></>)}
                </NavLink>
              </SideTooltip>

              <Divider />

              <SideTooltip label="Cerrar sesión" sideOpen={sideOpen}>
                <button onClick={() => { logout(); navigate('/login') }}
                  style={{ ...navItemStyle(false, sideOpen), color: '#ef4444' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:26 }}><LogOut size={17} color="#ef4444" /></span>
                  <NavLabel label="Cerrar sesión" sideOpen={sideOpen} />
                </button>
              </SideTooltip>
            </div>
          </aside>

          {/* ── Contenido principal — scrollea todo junto ── */}
          <main style={{ background: '#f5f7fb', borderRadius: 24, height: '100%', overflow: 'auto' }}>

            {/* Topbar — parte del contenido, scrollea con la página */}
            <div style={{ padding: '16px 24px 24px', background: '#f5f7fb' }}>
              <div style={{ maxWidth: '72rem', margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Search */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={14} color="#9ca3af" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input
                    placeholder="Buscar cliente, placa, póliza..."
                    style={{ width:'100%', height:38, padding:'0 16px 0 38px', borderRadius:999, border:'none', background:'#fff', fontSize:13, color:'#111827', outline:'none', boxSizing:'border-box', fontFamily:'Inter, system-ui, sans-serif' }}
                    onFocus={e => e.target.style.boxShadow = '0 0 0 2px #a5b4fc'}
                    onBlur={e => e.target.style.boxShadow = 'none'}
                  />
                </div>
                {/* Bell + user */}
                <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  <NotificationBell />
                  <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', borderRadius:999, padding:'4px 12px 4px 4px' }}>
                    <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#2D2A7A)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:11, fontWeight:800, color:'#fff', textTransform:'uppercase', lineHeight:1 }}>{initials||'?'}</span>
                    </div>
                    <span style={{ fontSize:13, fontWeight:500, color:'#111827', fontFamily:'Poppins', whiteSpace:'nowrap' }}>{display}</span>
                  </div>
                </div>
              </div>
            </div>

            <Outlet />
          </main>

        </div>
      </div>
    </div>
    <IAAssistant />
    </SSEProvider>
  )
}
