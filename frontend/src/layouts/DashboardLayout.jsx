import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Home, FileText, Shield, DollarSign, CreditCard,
  AlignJustify, Car, Bell,
  HelpCircle, Settings, LogOut,
} from 'lucide-react'
import { LogoFull, LogoIcon } from '../components/Logo'

const NAV_MAIN = [
  { to: '/dashboard',                        icon: Home,       label: 'Home'             },
  { to: '/dashboard/cotizaciones',           icon: FileText,   label: 'Cotizaciones'     },
  { to: '/dashboard/mis-polizas',            icon: Shield,     label: 'Mis pólizas'      },
  { to: '/dashboard/mis-pagos',              icon: DollarSign, label: 'Mis pagos'        },
  { to: '/dashboard/informacion-financiera', icon: CreditCard, label: 'Info. financiera' },
]

const NAV_SUPPORT = [
  { icon: HelpCircle, label: 'Soporte'       },
  { icon: Settings,   label: 'Configuración' },
]


export default function DashboardLayout() {
  const navigate   = useNavigate()
  const [open, setOpen] = useState(true)

  const sidebarW = open ? 200 : 60

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#fff', fontFamily:'Inter, system-ui, sans-serif' }}>

      {/* ── Contenedor principal ────────────────────────── */}
      <div style={{ flex:1, padding:'6px', overflow:'hidden' }}>
        <div style={{
          display:      'grid',
          gridTemplateColumns: `${sidebarW}px 1fr`,
          border:       '2px solid #eeeeef',
          borderRadius: 28,
          height:       '100%',
          overflow:     'hidden',
          transition:   'grid-template-columns 0.25s cubic-bezier(0.4,0,0.2,1)',
          background:   '#fff',
        }}>

          {/* ── Sidebar ───────────────────────────────── */}
          <aside style={{
            width:          sidebarW,
            height:         '100%',
            background:     '#fff',
            borderRadius:   28,
            display:        'flex',
            flexDirection:  'column',
            overflow:       'hidden',
            transition:     'width 0.25s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <nav style={{ padding:'20px 10px', display:'flex', flexDirection:'column', gap:2, flex:1 }}>

              {/* Hamburger */}
              <div style={{ paddingBottom:24, paddingLeft:2 }}>
                <button
                  onClick={() => setOpen(v => !v)}
                  style={{ width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:'none', borderRadius:50, cursor:'pointer', transition:'background 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#edeef3'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <AlignJustify size={20} color="#2D2A7A" />
                </button>
              </div>

              {/* ── Sección principal ── */}
              {NAV_MAIN.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={label}
                  to={to}
                  end={to === '/dashboard'}
                  style={({ isActive }) => ({
                    display:        'flex',
                    alignItems:     'center',
                    gap:            12,
                    height:         40,
                    padding:        '0 6px',
                    borderRadius:   50,
                    textDecoration: 'none',
                    fontWeight:     600,
                    fontSize:       14,
                    color:          isActive ? '#2D2A7A' : '#16151b',
                    background:     isActive ? '#edeef3' : 'transparent',
                    transition:     'background 0.15s, color 0.15s',
                    overflow:       'hidden',
                    whiteSpace:     'nowrap',
                    flexShrink:     0,
                  })}
                  onMouseEnter={e => { if (!e.currentTarget.dataset.active) e.currentTarget.style.background='#edeef3' }}
                  onMouseLeave={e => { if (!e.currentTarget.dataset.active) e.currentTarget.style.background='transparent' }}
                >
                  {({ isActive }) => (
                    <>
                      <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:28 }}>
                        <Icon size={19} color={isActive ? '#2D2A7A' : '#374151'} />
                      </span>
                      <span style={{ opacity:open?1:0, maxWidth:open?140:0, overflow:'hidden', transition:'opacity 0.2s ease, max-width 0.25s ease' }}>
                        {label}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}

              {/* ── Divisor ── */}
              <div style={{ margin:'10px 6px', borderTop:'1px solid #eeeeef' }} />

              {/* ── Sección soporte ── */}
              {open && (
                <span style={{ fontSize:10, fontWeight:700, color:'#b0b4c1', textTransform:'uppercase', letterSpacing:'0.08em', padding:'0 6px', marginBottom:2 }}>
                  Ayuda
                </span>
              )}
              {NAV_SUPPORT.map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        12,
                    height:     40,
                    padding:    '0 6px',
                    borderRadius: 50,
                    border:     'none',
                    background: 'transparent',
                    color:      '#16151b',
                    fontWeight: 600,
                    fontSize:   14,
                    cursor:     'pointer',
                    width:      '100%',
                    overflow:   'hidden',
                    whiteSpace: 'nowrap',
                    transition: 'background 0.15s',
                    flexShrink: 0,
                    textAlign:  'left',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='#edeef3'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:28 }}>
                    <Icon size={19} color="#374151" />
                  </span>
                  <span style={{ opacity:open?1:0, maxWidth:open?140:0, overflow:'hidden', transition:'opacity 0.2s ease, max-width 0.25s ease' }}>
                    {label}
                  </span>
                </button>
              ))}
            </nav>

            {/* Cotizar + Logout al fondo */}
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
                <span style={{ opacity:open?1:0, maxWidth:open?140:0, overflow:'hidden', transition:'opacity 0.2s ease, max-width 0.25s ease' }}>
                  Iniciar cotización
                </span>
              </button>

              <button
                onClick={() => navigate('/login')}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:12, height:40, padding:'0 6px', borderRadius:50, border:'none', background:'transparent', color:'#dc2626', fontWeight:600, fontSize:14, cursor:'pointer', overflow:'hidden', whiteSpace:'nowrap', transition:'background 0.15s', marginTop:4, flexShrink:0 }}
                onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:28 }}>
                  <LogOut size={18} />
                </span>
                <span style={{ opacity:open?1:0, maxWidth:open?140:0, overflow:'hidden', transition:'opacity 0.2s ease, max-width 0.25s ease' }}>
                  Cerrar sesión
                </span>
              </button>
            </div>
          </aside>

          {/* ── Contenido principal ───────────────────── */}
          <main style={{ background:'#eeeeef', borderRadius:24, overflow:'auto', height:'100%', display:'flex', flexDirection:'column' }}>

            {/* Topbar integrado dentro del contenido */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', height:64, background:'#eeeeef', flexShrink:0 }}>
              {/* Logo */}
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <LogoIcon size={30} />
                <div style={{ lineHeight:'17px' }}>
                  <p style={{ fontWeight:600, fontSize:16, color:'#16151b', margin:0 }}>Asegura2.com</p>
                  <p style={{ fontWeight:400, fontSize:11, color:'#a2a8c0', margin:0 }}>Portal de aliados</p>
                </div>
              </div>

              {/* Derecha */}
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div
                  style={{ background:'#e2e3e8', borderRadius:'50%', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'background 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#d5d6dc'}
                  onMouseLeave={e=>e.currentTarget.style.background='#e2e3e8'}
                >
                  <Bell size={17} color="#374151" />
                </div>

              </div>
            </div>

            {/* Página */}
            <div style={{ flex:1, overflow:'auto' }}>
              <Outlet />
            </div>
          </main>

        </div>
      </div>
    </div>
  )
}
