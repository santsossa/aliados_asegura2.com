import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, Users, FileText, Shield,
  DollarSign, BarChart3, AlignJustify, Bell, LogOut,
} from 'lucide-react'
import { LogoFull, LogoIcon } from '../components/Logo'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/admin',              icon: LayoutDashboard, label: 'Dashboard',     end: true },
  { to: '/admin/aliados',      icon: Users,           label: 'Aliados'              },
  { to: '/admin/leads',        icon: FileText,        label: 'Leads'                },
  { to: '/admin/polizas',      icon: Shield,          label: 'Pólizas'              },
  { to: '/admin/liquidaciones',icon: DollarSign,      label: 'Liquidaciones'        },
  { to: '/admin/reportes',     icon: BarChart3,       label: 'Reportes'             },
]

export default function AdminLayout() {
  const navigate     = useNavigate()
  const { logout, user } = useAuth()
  const [open, setOpen]  = useState(true)
  const W = open ? 200 : 60

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#fff', fontFamily:'Inter, system-ui, sans-serif' }}>
      <div style={{ flex:1, padding:'6px', overflow:'hidden' }}>
        <div style={{
          display:'grid', gridTemplateColumns:`${W}px 1fr`,
          border:'2px solid #eeeeef', borderRadius:28,
          height:'100%', overflow:'hidden',
          transition:'grid-template-columns 0.25s cubic-bezier(0.4,0,0.2,1)',
          background:'#fff',
        }}>

          {/* ── Sidebar admin ──────────────────────── */}
          <aside style={{ width:W, height:'100%', background:'#fff', borderRadius:28, display:'flex', flexDirection:'column', overflow:'hidden', transition:'width 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
            <nav style={{ padding:'20px 10px', display:'flex', flexDirection:'column', gap:2, flex:1 }}>

              {/* Hamburger */}
              <div style={{ paddingBottom:16, paddingLeft:2 }}>
                <button onClick={() => setOpen(v=>!v)}
                  style={{ width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:'none', borderRadius:50, cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#edeef3'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <AlignJustify size={20} color="#2D2A7A" />
                </button>
              </div>

              {/* Badge admin */}
              {open && (
                <div style={{ margin:'0 6px 12px', background:'#eeedf8', borderRadius:8, padding:'4px 10px', display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#2D2A7A' }} />
                  <span style={{ fontSize:11, fontWeight:700, color:'#2D2A7A' }}>Panel Admin</span>
                </div>
              )}

              {NAV_ITEMS.map(({ to, icon:Icon, label, end }) => (
                <NavLink key={to} to={to} end={end}
                  style={({ isActive }) => ({
                    display:'flex', alignItems:'center', gap:12, height:40,
                    padding:'0 6px', borderRadius:50, textDecoration:'none',
                    fontWeight:600, fontSize:14,
                    color: isActive ? '#2D2A7A' : '#16151b',
                    background:'transparent', overflow:'hidden', whiteSpace:'nowrap',
                    transition:'background 0.15s, color 0.15s',
                  })}
                  onMouseEnter={e=>e.currentTarget.style.background='#edeef3'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  {({ isActive }) => (
                    <>
                      <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:28 }}>
                        <Icon size={19} color={isActive?'#2D2A7A':'#374151'} />
                      </span>
                      <span style={{ opacity:open?1:0, maxWidth:open?140:0, overflow:'hidden', transition:'opacity 0.2s, max-width 0.25s' }}>
                        {label}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Logout */}
            <div style={{ padding:'10px', borderTop:'1px solid #eeeeef' }}>
              <button onClick={logout}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:12, height:40, padding:'0 6px', borderRadius:50, border:'none', background:'transparent', color:'#dc2626', fontWeight:600, fontSize:14, cursor:'pointer', overflow:'hidden', whiteSpace:'nowrap' }}
                onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:28 }}>
                  <LogOut size={18} />
                </span>
                <span style={{ opacity:open?1:0, maxWidth:open?140:0, overflow:'hidden', transition:'opacity 0.2s, max-width 0.25s' }}>
                  Cerrar sesión
                </span>
              </button>
            </div>
          </aside>

          {/* ── Main admin ──────────────────────────── */}
          <main style={{ background:'#eeeeef', borderRadius:24, overflow:'auto', height:'100%', display:'flex', flexDirection:'column' }}>
            {/* Topbar */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', height:64, background:'#eeeeef', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <LogoIcon size={30} />
                <div style={{ lineHeight:'17px' }}>
                  <p style={{ fontWeight:600, fontSize:16, color:'#16151b', margin:0 }}>Asegura2.com</p>
                  <p style={{ fontWeight:400, fontSize:11, color:'#a2a8c0', margin:0 }}>Panel de administración</p>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ background:'#e2e3e8', borderRadius:'50%', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                  <Bell size={17} color="#374151" />
                </div>
                <div style={{ background:'#2D2A7A', borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ color:'#fff', fontWeight:700, fontSize:12 }}>
                    {user?.nombre?.[0]?.toUpperCase() || 'A'}
                  </span>
                </div>
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
