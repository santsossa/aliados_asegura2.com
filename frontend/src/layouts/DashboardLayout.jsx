import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Home, FileText, Shield, DollarSign, CreditCard,
  AlignJustify, Car, X, LogOut, HelpCircle, Settings,
} from 'lucide-react'
import { LogoFull, LogoIcon } from '../components/Logo'
import { useIsMobile } from '../hooks/use-mobile'
import { useAuth } from '../context/AuthContext'
import NotificationBell from '../components/NotificationBell'

const NAV_MAIN = [
  { to: '/dashboard',                        icon: Home,       label: 'Home'             },
  { to: '/dashboard/cotizaciones',           icon: FileText,   label: 'Cotizaciones'     },
  { to: '/dashboard/mis-polizas',            icon: Shield,     label: 'Mis pólizas'      },
  { to: '/dashboard/mis-pagos',              icon: DollarSign, label: 'Mis pagos'        },
  { to: '/dashboard/informacion-financiera', icon: CreditCard, label: 'Info. financiera' },
]

// ── Bottom nav para móvil (4 ítems + botón central cotizar) ─────────────────
const NAV_BOTTOM = [
  { to: '/dashboard',              icon: Home,       label: 'Home'        },
  { to: '/dashboard/cotizaciones', icon: FileText,   label: 'Cotizaciones'},
  null, // espacio para el botón central
  { to: '/dashboard/mis-polizas',  icon: Shield,     label: 'Pólizas'     },
  { to: '/dashboard/mis-pagos',    icon: DollarSign, label: 'Pagos'       },
]

export default function DashboardLayout() {
  const navigate    = useNavigate()
  const isMobile    = useIsMobile()
  const { logout }  = useAuth()
  const [sideOpen, setSideOpen] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // En tablet/desktop: sidebar colapsable
  const sidebarW = sideOpen ? 200 : 60

  // ── MÓVIL ─────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100dvh', background:'#f4f4f6', fontFamily:'Inter, system-ui, sans-serif' }}>

        {/* Topbar móvil */}
        <header style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 16px', height:56, background:'#fff',
          borderBottom:'1px solid #eeeeef', flexShrink:0, zIndex:10,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <LogoIcon size={26} />
            <div style={{ lineHeight:'16px' }}>
              <p style={{ fontWeight:700, fontSize:14, color:'#16151b', margin:0 }}>Asegura2.com</p>
              <p style={{ fontWeight:400, fontSize:10, color:'#a2a8c0', margin:0 }}>Portal de aliados</p>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <NotificationBell />
            <button
              onClick={() => setDrawerOpen(true)}
              style={{ width:36, height:36, borderRadius:'50%', background:'#f3f4f6', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
            >
              <AlignJustify size={18} color="#2D2A7A" />
            </button>
          </div>
        </header>

        {/* Contenido */}
        <main style={{ flex:1, overflowY:'auto', background:'#fff' }}>
          <Outlet />
        </main>

        {/* Bottom navigation */}
        <nav style={{
          display:'flex', alignItems:'center', justifyContent:'space-around',
          height:64, background:'#fff', borderTop:'1px solid #eeeeef',
          flexShrink:0, position:'relative', zIndex:10, paddingBottom:'env(safe-area-inset-bottom)',
        }}>
          {NAV_BOTTOM.map((item, i) => {
            if (!item) {
              // Botón central "Cotizar"
              return (
                <div key="cotizar" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                  <button
                    onClick={() => navigate('/dashboard/cotizar')}
                    style={{
                      width:52, height:52, borderRadius:'50%',
                      background:'#2D2A7A', border:'none', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow:'0 4px 14px rgba(45,42,122,0.35)',
                      marginTop:-18,
                    }}
                  >
                    <Car size={22} color="#fff" />
                  </button>
                  <span style={{ fontSize:9, color:'#2D2A7A', fontWeight:700, marginTop:2 }}>Cotizar</span>
                </div>
              )
            }
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                style={({ isActive }) => ({
                  display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                  textDecoration:'none', flex:1, padding:'6px 0',
                  color: isActive ? '#2D2A7A' : '#9ca3af',
                })}
              >
                {({ isActive }) => (
                  <>
                    <div style={{
                      width:32, height:28, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
                      background: isActive ? '#edeef3' : 'transparent',
                    }}>
                      <Icon size={18} color={isActive ? '#2D2A7A' : '#9ca3af'} />
                    </div>
                    <span style={{ fontSize:9, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Drawer lateral (menú completo en móvil) */}
        {drawerOpen && (
          <>
            <div
              onClick={() => setDrawerOpen(false)}
              style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:40 }}
            />
            <div style={{
              position:'fixed', top:0, right:0, bottom:0, width:260,
              background:'#fff', zIndex:50, display:'flex', flexDirection:'column',
              boxShadow:'-4px 0 24px rgba(0,0,0,0.12)',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #eeeeef' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <LogoIcon size={24} />
                  <span style={{ fontWeight:700, fontSize:14, color:'#16151b' }}>Menú</span>
                </div>
                <button onClick={() => setDrawerOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af' }}>
                  <X size={20} />
                </button>
              </div>
              <nav style={{ flex:1, padding:'12px 12px', overflowY:'auto' }}>
                {NAV_MAIN.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={label} to={to}
                    end={to === '/dashboard'}
                    onClick={() => setDrawerOpen(false)}
                    style={({ isActive }) => ({
                      display:'flex', alignItems:'center', gap:12,
                      height:46, padding:'0 12px', borderRadius:12,
                      textDecoration:'none', fontWeight:600, fontSize:14,
                      color: isActive ? '#2D2A7A' : '#374151',
                      background: isActive ? '#edeef3' : 'transparent',
                      marginBottom:2,
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={18} color={isActive ? '#2D2A7A' : '#374151'} />
                        <span>{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
                <div style={{ margin:'10px 0', borderTop:'1px solid #eeeeef' }} />
                <button
                  onClick={() => { navigate('/dashboard/cotizar'); setDrawerOpen(false) }}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:12, height:46, padding:'0 12px', borderRadius:12, border:'none', background:'#2D2A7A', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', marginBottom:4 }}
                >
                  <Car size={18} /> Iniciar cotización
                </button>
              </nav>
              <div style={{ padding:'12px', borderTop:'1px solid #eeeeef' }}>
                <button
                  onClick={() => { logout(); navigate('/login') }}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:12, height:46, padding:'0 12px', borderRadius:12, border:'none', background:'#fef2f2', color:'#dc2626', fontWeight:600, fontSize:14, cursor:'pointer' }}
                >
                  <LogOut size={18} /> Cerrar sesión
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── TABLET / DESKTOP ───────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#fff', fontFamily:'Inter, system-ui, sans-serif' }}>
      <div style={{ flex:1, padding:'6px', overflow:'hidden' }}>
        <div style={{
          display:'grid',
          gridTemplateColumns: `${sidebarW}px 1fr`,
          border:'2px solid #eeeeef',
          borderRadius:28,
          height:'100%',
          overflow:'hidden',
          transition:'grid-template-columns 0.25s cubic-bezier(0.4,0,0.2,1)',
          background:'#fff',
        }}>

          {/* Sidebar */}
          <aside style={{
            width:sidebarW, height:'100%', background:'#fff', borderRadius:28,
            display:'flex', flexDirection:'column', overflow:'hidden',
            transition:'width 0.25s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <nav style={{ padding:'20px 10px', display:'flex', flexDirection:'column', gap:2, flex:1 }}>
              <div style={{ paddingBottom:24, paddingLeft:2 }}>
                <button
                  onClick={() => setSideOpen(v => !v)}
                  style={{ width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:'none', borderRadius:50, cursor:'pointer', transition:'background 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#edeef3'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <AlignJustify size={20} color="#2D2A7A" />
                </button>
              </div>

              {NAV_MAIN.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={label} to={to}
                  end={to === '/dashboard'}
                  style={({ isActive }) => ({
                    display:'flex', alignItems:'center', gap:12,
                    height:40, padding:'0 6px', borderRadius:50,
                    textDecoration:'none', fontWeight:600, fontSize:14,
                    color: isActive ? '#2D2A7A' : '#16151b',
                    background: isActive ? '#edeef3' : 'transparent',
                    transition:'background 0.15s, color 0.15s',
                    overflow:'hidden', whiteSpace:'nowrap', flexShrink:0,
                  })}
                  onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background='#edeef3' }}
                  onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background='transparent' }}
                >
                  {({ isActive }) => (
                    <>
                      <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:28 }}>
                        <Icon size={19} color={isActive ? '#2D2A7A' : '#374151'} />
                      </span>
                      <span style={{ opacity:sideOpen?1:0, maxWidth:sideOpen?140:0, overflow:'hidden', transition:'opacity 0.2s ease, max-width 0.25s ease' }}>
                        {label}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}

              <div style={{ margin:'10px 6px', borderTop:'1px solid #eeeeef' }} />

              {sideOpen && (
                <span style={{ fontSize:10, fontWeight:700, color:'#b0b4c1', textTransform:'uppercase', letterSpacing:'0.08em', padding:'0 6px', marginBottom:2 }}>
                  Ayuda
                </span>
              )}
              {[{ icon: HelpCircle, label:'Soporte' }, { icon: Settings, label:'Configuración' }].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  style={{ display:'flex', alignItems:'center', gap:12, height:40, padding:'0 6px', borderRadius:50, border:'none', background:'transparent', color:'#16151b', fontWeight:600, fontSize:14, cursor:'pointer', width:'100%', overflow:'hidden', whiteSpace:'nowrap', transition:'background 0.15s', flexShrink:0, textAlign:'left' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#edeef3'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:28 }}>
                    <Icon size={19} color="#374151" />
                  </span>
                  <span style={{ opacity:sideOpen?1:0, maxWidth:sideOpen?140:0, overflow:'hidden', transition:'opacity 0.2s ease, max-width 0.25s ease' }}>
                    {label}
                  </span>
                </button>
              ))}
            </nav>

            <div style={{ padding:'10px', borderTop:'1px solid #eeeeef' }}>
              <button
                onClick={() => navigate('/dashboard/cotizar')}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:12, height:40, padding:'0 6px', borderRadius:50, border:'none', background:'#2D2A7A', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', overflow:'hidden', whiteSpace:'nowrap', transition:'background 0.2s', flexShrink:0 }}
                onMouseEnter={e=>e.currentTarget.style.background='#201D5F'}
                onMouseLeave={e=>e.currentTarget.style.background='#2D2A7A'}
              >
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:28 }}>
                  <Car size={18} />
                </span>
                <span style={{ opacity:sideOpen?1:0, maxWidth:sideOpen?140:0, overflow:'hidden', transition:'opacity 0.2s ease, max-width 0.25s ease' }}>
                  Iniciar cotización
                </span>
              </button>
              <button
                onClick={() => { logout(); navigate('/login') }}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:12, height:40, padding:'0 6px', borderRadius:50, border:'none', background:'transparent', color:'#dc2626', fontWeight:600, fontSize:14, cursor:'pointer', overflow:'hidden', whiteSpace:'nowrap', transition:'background 0.15s', marginTop:4, flexShrink:0 }}
                onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:28 }}>
                  <LogOut size={18} />
                </span>
                <span style={{ opacity:sideOpen?1:0, maxWidth:sideOpen?140:0, overflow:'hidden', transition:'opacity 0.2s ease, max-width 0.25s ease' }}>
                  Cerrar sesión
                </span>
              </button>
            </div>
          </aside>

          {/* Contenido principal */}
          <main style={{ background:'#eeeeef', borderRadius:24, overflow:'auto', height:'100%', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', height:64, background:'#eeeeef', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <LogoIcon size={30} />
                <div style={{ lineHeight:'17px' }}>
                  <p style={{ fontWeight:600, fontSize:16, color:'#16151b', margin:0 }}>Asegura2.com</p>
                  <p style={{ fontWeight:400, fontSize:11, color:'#a2a8c0', margin:0 }}>Portal de aliados</p>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <NotificationBell />
              </div>
            </div>
            <div style={{ flex:1, overflow:'auto' }}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
