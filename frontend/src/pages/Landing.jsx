import { useState, useEffect } from 'react'
import { ArrowRight, ChevronDown, ChevronUp, Shield, DollarSign, Zap, BarChart3, Star, UserPlus, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LogoFull } from '../components/Logo'

import imgCcManizales from '../assets/ccMANIZALES.png'
import imgCcCucuta    from '../assets/ccCUCUTA.png'

import imgSura      from '../assets/sura.webp'
import imgAxa       from '../assets/axa.webp'
import imgBolivar   from '../assets/bolivar.webp'
import imgAllianz   from '../assets/allianz.webp'
import imgHdi       from '../assets/hdi.webp'
import imgMapfre    from '../assets/mapfre.webp'
import imgEquidad   from '../assets/equidad.webp'
import imgEstado    from '../assets/estado.webp'
import imgSbs       from '../assets/sbs.webp'
import imgSolidaria from '../assets/solidaria.webp'

const ASEGURADORAS = [
  { name: 'Sura',      img: imgSura      },
  { name: 'AXA',       img: imgAxa       },
  { name: 'Bolívar',   img: imgBolivar   },
  { name: 'Allianz',   img: imgAllianz   },
  { name: 'HDI',       img: imgHdi       },
  { name: 'Mapfre',    img: imgMapfre    },
  { name: 'Equidad',   img: imgEquidad   },
  { name: 'Estado',    img: imgEstado    },
  { name: 'SBS',       img: imgSbs       },
  { name: 'Solidaria', img: imgSolidaria },
]

const NAV_LINKS = [
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Beneficios',    href: '#beneficios'     },
  { label: 'Para quién',    href: '#para-quien'     },
  { label: 'Preguntas',     href: '#preguntas'      },
]

const BENEFICIOS = [
  { icon: DollarSign, color: 'text-green-600',  bg: 'bg-green-50',   title: '6% de comisión por póliza',      desc: 'Gana el 6% sobre el valor de la prima, sin IVA. Sin topes ni restricciones.'           },
  { icon: Zap,        color: 'text-brand',       bg: 'bg-brand-light', title: 'Cotizador en segundos',          desc: 'Compara entre 10 aseguradoras en tiempo real desde tu portal personalizado.'     },
  { icon: BarChart3,  color: 'text-purple-600',  bg: 'bg-purple-50',  title: 'Seguimiento en tiempo real',     desc: 'Ve el estado de cada póliza, tus comisiones y tu próximo pago en un solo lugar.' },
  { icon: Shield,     color: 'text-accent',      bg: 'bg-accent-light',title: 'Respaldo de marca reconocida',  desc: 'Vende bajo el respaldo de Asegura2.com, con años de experiencia en el mercado.'  },
]

const TESTIMONIOS = [
  { name: 'Juan Cardona',  role: 'Asesor · Honda Bogotá',         stars: 5, text: 'Como asesor de concesionario, esto cambió todo. Ofrezco el seguro en el mismo momento de la venta y cobro sin complicaciones.' },
  { name: 'María López',   role: 'Aliada independiente · Medellín', stars: 5, text: 'Cobro mis comisiones puntual cada 1 de mes. La plataforma es muy fácil de usar y el equipo responde siempre.' },
  { name: 'Carlos Muñoz',  role: 'Vendedor · Concesionario Toyota', stars: 5, text: 'En mi primer mes cerré 8 pólizas. La herramienta de cotización es increíble y el proceso es muy ágil.' },
]

const FAQS = [
  { q: '¿Cómo me registro como aliado?',           a: 'Crea tu cuenta gratis en minutos. Solo necesitas tus datos personales, número de cédula y cuenta bancaria para recibir tus pagos. Una vez verificado, tienes acceso inmediato a la plataforma.' },
  { q: '¿Cuándo recibo mis comisiones?',            a: 'Los pagos se realizan el 1 de cada mes. Solo se pagan las pólizas en las que el cliente haya pagado la primera cuota o haya pagado de contado ese mes.' },
  { q: '¿Puedo ver el estado de mis pólizas?',      a: 'Sí. Desde tu dashboard puedes ver en tiempo real si cada póliza está en proceso, aprobada o no convertida, con la explicación de cada estado.' },
  { q: '¿Con cuántas aseguradoras trabajan?',       a: 'Actualmente comparamos entre 10 aseguradoras: Sura, AXA, Bolívar, Allianz, HDI, Mapfre, Equidad, Estado, SBS y Solidaria.' },
  { q: '¿Hay algún costo por registrarse?',         a: 'No. El registro y el uso de la plataforma son completamente gratuitos. Solo ganas cuando vendes.' },
]

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      onClick={() => setOpen(v => !v)}
      className="w-full text-left bg-white border border-gray-100 rounded-2xl px-6 py-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-gray-800 text-sm">{q}</span>
        {open ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </div>
      {open && <p className="text-sm text-gray-500 mt-3 leading-relaxed">{a}</p>}
    </button>
  )
}

/* ── Dashboard mockup ─────────────────────────────────────────── */
/* ── Carousel Cómo Funciona ───────────────────────────────────── */
const PASOS_DATA = [
  {
    bg: '#16a34a', lightBg: '#f0fdf4',
    n: '01', title: 'Regístrate gratis',
    desc: 'Crea tu cuenta con tus datos básicos y cuenta bancaria. Sin costos ni trámites.',
    icon: UserPlus,
    illustration: (
      <div style={{ width:'100%', height:'100%', background:'#ffffff', display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0 20px 0' }}>
        <div style={{ background:'#fff', borderRadius:14, padding:'12px 14px', width:210, boxShadow:'0 8px 24px rgba(22,163,74,0.15)', transform:'translateY(20px)' }}>
          <p style={{ fontSize:9, color:'#16a34a', fontWeight:800, marginBottom:8 }}>Crear cuenta · Asegura2.com</p>
          {['Nombre completo','Correo electrónico','Cédula','Ciudad'].map(f=>(
            <div key={f} style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:7, height:22, marginBottom:4, padding:'0 8px', display:'flex', alignItems:'center' }}>
              <span style={{ fontSize:8, color:'#6b7280' }}>{f}</span>
            </div>
          ))}
          <div style={{ background:'#16a34a', borderRadius:7, height:24, display:'flex', alignItems:'center', justifyContent:'center', marginTop:5 }}>
            <span style={{ fontSize:8, color:'#fff', fontWeight:700 }}>Crear cuenta →</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    bg: '#2D2A7A', lightBg: '#eef2ff',
    n: '02', title: 'Cotiza al instante',
    desc: 'Compara 10 aseguradoras en segundos. Tu cliente elige la mejor opción del mercado.',
    icon: Zap,
    illustration: (
      <div style={{ width:'100%', height:'100%', background:'#ffffff', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <div style={{ background:'#fff', borderRadius:16, padding:'16px 18px', width:220, boxShadow:'0 12px 40px rgba(45,42,122,0.2)', transform:'translateY(20px)' }}>
          <p style={{ fontSize:9, color:'#2D2A7A', fontWeight:800, marginBottom:10 }}>Resultados · Honda Civic</p>
          {[
            { name:'SURA',    price:'$142.000/mes', best:true  },
            { name:'Allianz', price:'$158.000/mes', best:false },
            { name:'Bolívar', price:'$161.000/mes', best:false },
            { name:'HDI',     price:'$167.000/mes', best:false },
          ].map(r=>(
            <div key={r.name} style={{ background:r.best?'#2D2A7A':'#f9fafb', borderRadius:8, height:26, marginBottom:5, padding:'0 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:9, fontWeight:600, color:r.best?'#fff':'#374151' }}>{r.name}</span>
              <span style={{ fontSize:8, fontWeight:700, color:r.best?'#c7d2fe':'#6b7280' }}>{r.price}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    bg: '#7c3aed', lightBg: '#faf5ff',
    n: '03', title: 'Envíanos el cliente',
    desc: 'Nosotros llamamos, emitimos y cerramos la venta. Tú no tienes que hacer nada más.',
    icon: Send,
    illustration: (
      <div style={{ width:'100%', height:'100%', background:'#ffffff', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <div style={{ background:'#fff', borderRadius:16, padding:'16px 18px', width:220, boxShadow:'0 12px 40px rgba(124,58,237,0.2)', transform:'translateY(20px)' }}>
          <p style={{ fontSize:9, color:'#7c3aed', fontWeight:800, marginBottom:8 }}>Emitir póliza · SURA</p>
          <div style={{ background:'#f5f3ff', borderRadius:8, padding:'6px 10px', marginBottom:8 }}>
            <p style={{ fontSize:8, color:'#7c3aed', fontWeight:600 }}>✅ Honda Civic · $142.000/mes</p>
          </div>
          {['Nombre del cliente','Teléfono'].map(f=>(
            <div key={f} style={{ background:'#f5f3ff', borderRadius:8, height:26, marginBottom:6, padding:'0 10px', display:'flex', alignItems:'center' }}>
              <span style={{ fontSize:8, color:'#9ca3af' }}>{f}</span>
            </div>
          ))}
          <div style={{ background:'#7c3aed', borderRadius:8, height:28, display:'flex', alignItems:'center', justifyContent:'center', marginTop:4 }}>
            <span style={{ fontSize:9, color:'#fff', fontWeight:700 }}>Enviar lead →</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    bg: '#d97706', lightBg: '#fffbeb',
    n: '04', title: 'Cobra el 1 de mes',
    desc: 'Depósito automático a tu cuenta por cada póliza donde el cliente haya pagado.',
    icon: DollarSign,
    illustration: (
      <div style={{ width:'100%', height:'100%', background:'#ffffff', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <div style={{ background:'#fff', borderRadius:16, padding:'16px 18px', width:220, boxShadow:'0 12px 40px rgba(217,119,6,0.2)', transform:'translateY(20px)' }}>
          <p style={{ fontSize:9, color:'#d97706', fontWeight:800, marginBottom:2 }}>Pago depositado ✅</p>
          <p style={{ fontSize:8, color:'#9ca3af', marginBottom:10 }}>1 de junio · Bancolombia</p>
          <p style={{ fontSize:28, fontWeight:900, color:'#1f2937', marginBottom:10, lineHeight:1 }}>$840.000</p>
          {['SURA · Honda Civic +$142.000','Bolívar · Mazda 3 +$138.000','HDI · Sandero +$118.000'].map(r=>(
            <div key={r} style={{ background:'#fefce8', borderRadius:6, height:22, marginBottom:4, padding:'0 8px', display:'flex', alignItems:'center' }}>
              <span style={{ fontSize:7.5, color:'#92400e', fontWeight:500 }}>{r}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

function CarouselPasos() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % PASOS_DATA.length), 10000)
    return () => clearInterval(t)
  }, [active])

  return (
    <div style={{ maxWidth:860, margin:'0 auto', padding:'0 24px' }}>
      {/* Cards row */}
      <div style={{ display:'flex', gap:10, marginBottom:28, height:300 }}>
        {PASOS_DATA.map((paso, i) => {
          const isActive = i === active
          return (
            <div
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: isActive ? 340 : 163,
                flexShrink: 0,
                height: 300,
                borderRadius: 18,
                overflow: 'hidden',
                cursor: isActive ? 'default' : 'pointer',
                transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
                background: isActive ? '#ffffff' : '#f3f4f6',
                border: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                position: 'relative',
              }}
            >
              {/* ── Capa INACTIVA ── */}
              <div style={{
                position:'absolute', inset:0,
                opacity: isActive ? 0 : 1,
                transition:'opacity 0.4s ease',
                pointerEvents: isActive ? 'none' : 'auto',
                display:'flex', flexDirection:'column',
                padding:'16px 14px 18px',
                boxSizing:'border-box',
              }}>
                <span style={{ fontSize:32, fontWeight:800, color:'#e5e7eb', lineHeight:1 }}>{paso.n}</span>
                <div style={{ flex:1 }} />
                <paso.icon size={15} style={{ color:'#c4c4c4', marginBottom:5 }} />
                <h3 style={{ fontSize:12, fontWeight:700, color:'#374151', lineHeight:1.3, margin:0 }}>{paso.title}</h3>
              </div>

              {/* ── Capa ACTIVA ── */}
              <div style={{
                position:'absolute', inset:0,
                opacity: isActive ? 1 : 0,
                transition:'opacity 0.4s ease',
                pointerEvents: isActive ? 'auto' : 'none',
                display:'flex', flexDirection:'column',
              }}>
                {/* Ilustración — se sobrepone a la franja */}
                <div style={{ height:190, flexShrink:0, overflow:'visible', position:'relative', zIndex:2, background:'#fff' }}>
                  {paso.illustration}
                </div>
                {/* Franja gris — detrás de la ilustración */}
                <div style={{
                  flex:1, background:'#f3f4f6',
                  padding:'10px 16px 14px',
                  display:'flex', flexDirection:'column', justifyContent:'flex-end',
                  boxSizing:'border-box',
                  position:'relative', zIndex:1,
                }}>
                  <paso.icon size={15} style={{ color:'#9ca3af', marginBottom:5 }} />
                  <h3 style={{ fontSize:13, fontWeight:800, color:'#111827', lineHeight:1.25, margin:'0 0 4px' }}>{paso.title}</h3>
                  <p style={{ fontSize:11, color:'#6b7280', lineHeight:1.5, margin:0 }}>{paso.desc}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress dots */}
      <div style={{ display:'flex', justifyContent:'center', gap:8 }}>
        {PASOS_DATA.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              width: i === active ? 28 : 8, height: 8,
              borderRadius: 99,
              background: i === active ? '#2D2A7A' : '#d1d5db',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.3s ease', padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-md mx-auto" style={{ paddingTop: 24, paddingBottom: 24 }}>

      {/* Glow */}
      <div className="absolute inset-8 rounded-3xl blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #2D2A7A, #F5A623)' }} />

      {/* Phone frame */}
      <div className="relative mx-auto bg-white rounded-3xl overflow-hidden border border-gray-100 w-64"
        style={{ boxShadow: '0 32px 64px rgba(45,42,122,0.18)' }}>

        {/* Status bar */}
        <div className="bg-brand px-4 pt-3 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/60 text-[9px]">9:41</span>
            <div className="flex gap-1">
              <div className="w-3 h-1.5 bg-white/40 rounded-sm" />
              <div className="w-1 h-1.5 bg-white/40 rounded-sm" />
            </div>
          </div>
          <p className="text-white text-xs font-bold">Hola, Andrés 👋</p>
          <p className="text-white/60 text-[9px]">Bienvenido de vuelta al portal de aliados</p>
          <div className="mt-2">
            <p className="text-white/60 text-[8px]">Comisiones generadas</p>
            <p className="text-white text-xl font-black">$1.120.000</p>
            <p className="text-green-300 text-[8px]">+18% vs. mes anterior</p>
          </div>
        </div>

        {/* Body */}
        <div className="bg-gray-50 p-3 space-y-2">
          <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">Actividad reciente</p>
          {[
            { dot: '#22c55e', title: 'Póliza emitida',  sub: 'Comisión +$140.000',   right: '+$140.000',   rc: 'text-green-600' },
            { dot: '#3b82f6', title: 'Cotización creada', sub: 'Mazda 3 · $450.000', right: 'En proceso',  rc: 'text-blue-500'  },
            { dot: '#f59e0b', title: 'Pago recibido',   sub: 'Ciclo Dic 2024',       right: '+$370.000',  rc: 'text-yellow-600'},
          ].map((r, i) => (
            <div key={i} className="bg-white rounded-xl px-3 py-2 flex items-center justify-between border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.dot }} />
                <div>
                  <p className="text-[9px] font-semibold text-gray-800">{r.title}</p>
                  <p className="text-[8px] text-gray-400">{r.sub}</p>
                </div>
              </div>
              <span className={`text-[9px] font-bold ${r.rc}`}>{r.right}</span>
            </div>
          ))}

          <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wider pt-1">Accesos rápidos</p>
          <div className="grid grid-cols-2 gap-1.5">
            {['Nueva cotización','Mis clientes','Mis comisiones','Mis pólizas'].map(l => (
              <div key={l} className="bg-white border border-gray-100 rounded-xl px-2 py-2 text-center">
                <p className="text-[8px] font-medium text-gray-600">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating — cotización */}
      <div className="absolute top-6 -left-8 bg-white rounded-2xl px-3 py-2.5 border border-gray-100 flex items-center gap-2"
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-xs">🚗</div>
        <div>
          <p className="text-[9px] font-bold text-gray-800">Cotización creada</p>
          <p className="text-[8px] text-gray-400">Mazda 3 2022 · $450.000</p>
        </div>
      </div>

      {/* Floating — comisión */}
      <div className="absolute top-8 -right-6 bg-white rounded-2xl px-3 py-2.5 border border-gray-100"
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
        <p className="text-[8px] text-gray-400">Comisión recibida</p>
        <p className="text-sm font-black text-green-600">+$140.000</p>
        <p className="text-[8px] text-gray-400">Pago aprobado ✅</p>
      </div>

      {/* Floating — póliza emitida */}
      <div className="absolute -bottom-2 -left-6 bg-white rounded-2xl px-3 py-2.5 border border-gray-100 flex items-center gap-2"
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
        <div className="w-6 h-6 bg-green-50 rounded-full flex items-center justify-center text-xs">✅</div>
        <div>
          <p className="text-[9px] font-bold text-gray-800">Póliza emitida · SURA</p>
          <p className="text-[8px] text-green-600 font-semibold">+$140.000 comisión</p>
        </div>
      </div>

      {/* Floating — ventas */}
      <div className="absolute bottom-4 -right-6 bg-white rounded-2xl px-3 py-2.5 border border-gray-100"
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
        <p className="text-[8px] text-gray-400">Tus ventas este mes</p>
        <p className="text-sm font-black text-brand">12 pólizas</p>
        <p className="text-[8px] text-green-500">+35% vs. mes anterior</p>
      </div>
    </div>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen font-sans" style={{ background: 'linear-gradient(160deg, #f0f2ff 0%, #faf8ff 40%, #ffffff 100%)' }}>

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <div className="flex justify-center px-6 pt-5 sticky top-0 z-20">
        <nav className="flex items-center justify-between w-full max-w-5xl bg-white/80 backdrop-blur-md border border-gray-200/80 rounded-2xl px-5 py-2 shadow-sm">
          <LogoFull className="h-11" />
          <div className="hidden sm:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="text-sm text-gray-500 hover:text-brand font-medium transition-colors">{l.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 transition-colors">
              Iniciar sesión
            </Link>
            <Link to="/registro" className="bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              Registrarse
            </Link>
          </div>
        </nav>
      </div>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-14 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-10">

          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-light text-brand text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-brand/10">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              Portal de aliados · Asegura2.com
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5" style={{ letterSpacing: '-1px' }}>
              Vende seguros de vehículos y{' '}
              <span className="text-brand">gana<br />comisiones</span>{' '}
              cada mes
            </h1>

            <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
              Plataforma para asesores de concesionarios y compraventas de carros.<br />
              Cotiza, vende y recibe comisiones de las mejores aseguradoras. Sin costos, sin límites.
            </p>

            <div className="flex items-center gap-3 mb-8">
              <Link to="/registro" className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition-colors shadow-lg shadow-brand/25">
                Quiero ser aliado
                <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="border border-gray-200 bg-white text-gray-600 font-medium px-6 py-3.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Ya tengo cuenta
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center">
              {/* Avatars + texto */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex flex-shrink-0">
                  {[
                    'https://randomuser.me/api/portraits/men/32.jpg',
                    'https://randomuser.me/api/portraits/women/44.jpg',
                    'https://randomuser.me/api/portraits/men/55.jpg',
                    'https://randomuser.me/api/portraits/women/68.jpg',
                  ].map((src, i) => (
                    <img key={i} src={src} alt="aliado"
                      className="w-9 h-9 rounded-full object-cover"
                      style={{ marginLeft: i === 0 ? 0 : -18, zIndex: 4 - i }} />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 whitespace-nowrap">+124 aliados activos</p>
                  <p className="text-xs text-gray-400">vendiendo seguros y<br />ganando comisiones</p>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px bg-gray-200 mx-6 flex-shrink-0" style={{ height: 36 }} />

              {/* Stars */}
              <div className="flex-shrink-0">
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={13} className="text-accent fill-accent" />
                  ))}
                  <span className="text-sm font-bold text-gray-800 ml-1.5">4.9/5</span>
                </div>
                <p className="text-xs text-gray-400">Nuestros aliados<br />recomiendan Asegura2.com</p>
              </div>
            </div>
          </div>

          {/* Right — mockup */}
          <div className="hidden lg:block">
            <DashboardMockup />
          </div>
        </div>

      </section>

      {/* ── Stats card — exactamente en el centro de la transición ── */}
      <div className="relative z-10 px-6" style={{ marginTop: -44, marginBottom: -44 }}>
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-xl px-8 py-6
          grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          {[
            { value: '6% de comisión',  desc: 'Sin IVA, sobre el valor de la prima' },
            { value: 'Sin costos',      desc: 'El registro y uso son gratis'  },
            { value: 'Pago puntual',    desc: 'El 1 de cada mes sin falta'    },
            { value: 'Autonomía total', desc: 'Tú cotizas, nosotros cerramos' },
          ].map((s, i) => (
            <div key={s.value} className={`text-center py-3 sm:py-0 ${i > 0 ? 'sm:pl-6' : ''}`}>
              <p className="text-base font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cómo funciona ───────────────────────────────────────── */}
      <section id="como-funciona" className="pt-32 pb-20" style={{ background: '#f0fdf4' }}>
        <div className="text-center mb-10 px-6">
          <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-3">Proceso</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Cómo funciona</h2>
          <p className="text-gray-400 text-sm">De aliado a comisión en 4 pasos simples</p>
        </div>

        {/* Carousel 3D */}
        <CarouselPasos />

      </section>

      {/* ── Beneficios ──────────────────────────────────────────── */}
      <section id="beneficios" className="bg-white py-20 pt-32">
        <div className="max-w-5xl mx-auto px-6">

          {/* Header centrado */}
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-3">Beneficios</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Por qué los aliados eligen nuestra plataforma</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">Todo lo que necesitas para vender seguros y cobrar tus comisiones sin complicaciones.</p>
          </div>

          {/* Bento grid — tamaños variados */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

            {/* Card 1 — Comisión (ancha) */}
            <div className="sm:col-span-2 rounded-3xl border border-green-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
              <div className="px-6 pt-6 pb-4">
                <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Resumen Mayo</p>
                    <span className="text-[9px] bg-green-50 text-green-600 font-semibold px-2 py-0.5 rounded-full">↑ 18%</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 mb-3">$388.000</p>
                  <div className="grid grid-cols-3 gap-3 mt-1">
                    {[
                      { label: 'Póliza SURA',    sub: 'Honda Civic',  val: '+$150.000' },
                      { label: 'Póliza HDI',     sub: 'Mazda 3',      val: '+$126.000' },
                      { label: 'Póliza Allianz', sub: 'Sandero',      val: '+$112.000' },
                    ].map(r => (
                      <div key={r.label} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5">
                        <p className="text-[10px] font-semibold text-gray-600">{r.label}</p>
                        <p className="text-[9px] text-gray-400 mb-1">{r.sub}</p>
                        <p className="text-sm font-black text-green-600">{r.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <h3 className="font-bold text-gray-900 mb-1">6% de comisión por póliza (sin IVA)</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Ganas sobre el valor real de la prima. En carros de gama media son $70.000–$150.000 por póliza. Sin topes.</p>
              </div>
            </div>

            {/* Card 2 — Cotizador */}
            <div className="rounded-3xl border border-blue-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' }}>
              <div className="px-6 pt-6 pb-4">
                <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white p-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Resultados · Honda Civic 2023</p>
                  <div className="space-y-2">
                    {[
                      { img: imgSura,    name: 'SURA',    price: '$98.000/mes',  best: true  },
                      { img: imgAllianz, name: 'Allianz', price: '$104.000/mes', best: false },
                      { img: imgBolivar, name: 'Bolívar', price: '$112.000/mes', best: false },
                    ].map(r => (
                      <div key={r.name} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${r.best ? 'bg-brand text-white' : 'bg-white border border-gray-100'}`}>
                        <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center p-0.5 flex-shrink-0">
                          <img src={r.img} alt={r.name} className="w-full h-full object-contain" />
                        </div>
                        <span className={`text-[10px] font-semibold flex-1 ${r.best ? 'text-white' : 'text-gray-700'}`}>{r.name}</span>
                        <span className={`text-[10px] font-bold ${r.best ? 'text-white' : 'text-gray-500'}`}>{r.price}</span>
                        {r.best && <span className="text-[8px] bg-white/20 text-white px-1.5 py-0.5 rounded-full">Mejor precio</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <h3 className="font-bold text-gray-900 mb-1">Cotizador en tiempo real</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Compara 10 aseguradoras al mismo tiempo. Tu cliente ve las opciones y tú cierras en el momento.</p>
              </div>
            </div>

            {/* Card 3 — Seguimiento */}
            <div className="rounded-3xl border border-purple-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)' }}>
              <div className="px-6 pt-6 pb-4">
                <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Mis pólizas · Mayo</p>
                    <span className="text-[9px] text-brand font-semibold">Ver todas →</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Póliza SURA · Carlos M.',  estado: 'Aprobada',   dot: 'bg-green-400',  tag: 'bg-green-50 text-green-700'  },
                      { label: 'Póliza HDI · Ana R.',      estado: 'En proceso', dot: 'bg-yellow-400', tag: 'bg-yellow-50 text-yellow-700' },
                      { label: 'Póliza AXA · Luis G.',     estado: 'Aprobada',   dot: 'bg-green-400',  tag: 'bg-green-50 text-green-700'  },
                    ].map(r => (
                      <div key={r.label} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
                          <span className="text-[10px] text-gray-600">{r.label}</span>
                        </div>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${r.tag}`}>{r.estado}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <h3 className="font-bold text-gray-900 mb-1">Seguimiento en tiempo real</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Ve el estado de cada póliza, tus comisiones y tu próximo pago en un solo lugar. Sin llamar a nadie.</p>
              </div>
            </div>

            {/* Card 4 — Respaldo (ancha) */}
            <div className="sm:col-span-2 rounded-3xl border border-amber-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
              <div className="px-6 pt-6 pb-4">
                <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Aseguradoras activas</p>
                    <span className="text-[9px] bg-brand-light text-brand font-semibold px-2 py-0.5 rounded-full">10 disponibles</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { img: imgSura,      name: 'Sura'      },
                      { img: imgAxa,       name: 'AXA'       },
                      { img: imgBolivar,   name: 'Bolívar'   },
                      { img: imgAllianz,   name: 'Allianz'   },
                      { img: imgHdi,       name: 'HDI'       },
                      { img: imgMapfre,    name: 'Mapfre'    },
                      { img: imgEquidad,   name: 'Equidad'   },
                      { img: imgEstado,    name: 'Estado'    },
                      { img: imgSbs,       name: 'SBS'       },
                      { img: imgSolidaria, name: 'Solidaria' },
                    ].map((a, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
                        <div className="w-5 h-5 flex-shrink-0">
                          <img src={a.img} alt={a.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[10px] font-semibold text-gray-600 whitespace-nowrap">{a.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <h3 className="font-bold text-gray-900 mb-1">Respaldo de marca reconocida</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Vende con el respaldo de Asegura2.com y 10 aseguradoras líderes. Tus clientes confían más y cierras más fácil.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Banda de aseguradoras (ticker) ──────────────────────── */}
      <section className="py-10 bg-gray-50 border-y border-gray-100 overflow-hidden">
        <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-7">
          Respaldados por las principales aseguradoras del mercado
        </p>

        {/* Ticker con fade en bordes */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          }}
        >
          <div className="ticker-track">
            {[...ASEGURADORAS, ...ASEGURADORAS].map((a, i) => (
              <div
                key={i}
                className="ticker-item flex items-center gap-2.5 px-8 border-r border-gray-200 cursor-default"
                style={{ whiteSpace: 'nowrap' }}
              >
                <img
                  src={a.img}
                  alt={a.name}
                  className="h-6 w-auto object-contain"
                />
                <span className="text-sm font-semibold">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ¿Para quién es? ──────────────────────────────────────── */}
      <section id="para-quien" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">

          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-3">Perfiles</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">¿Este modelo es para ti?</h2>
            <p className="text-gray-400 text-sm max-w-lg mx-auto">Si tienes acceso a personas con carros o que están a punto de comprarlo, ya tienes todo lo que necesitas para ganar comisiones.</p>
          </div>

          {/* Grid de perfiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              {
                bg:    '#2D2A7A',
                emoji: '🏎️',
                title: 'Asesor de concesionario',
                desc:  'Cada entrega de carro nuevo es una comisión directa. El cliente ya confía en ti.',
                rotate: '-12deg',
              },
              {
                bg:    '#d97706',
                emoji: '🚗',
                title: 'Vendedor de carros usados',
                desc:  'Alto volumen de clientes que quieren proteger su inversión desde el primer día.',
                rotate: '10deg',
              },
              {
                bg:    '#0f766e',
                emoji: '🔧',
                title: 'Mecánico o taller',
                desc:  'Tus clientes ya tienen carro y confían en tu criterio. Recomienda su seguro y gana.',
                rotate: '-8deg',
              },
              {
                bg:    '#7c3aed',
                emoji: '📋',
                title: 'Tramitador vehicular',
                desc:  'Traspasos, RUNT, trámites — cada dueño de carro que atiendes es un cliente potencial.',
                rotate: '14deg',
              },
              {
                bg:    '#be185d',
                emoji: '🚕',
                title: 'Conductor o flota',
                desc:  'Conductores de apps, dueños de flotas, transportadores. Tu red ya tiene carros.',
                rotate: '-10deg',
              },
              {
                bg:    '#1d4ed8',
                emoji: '💼',
                title: 'Quiero ingresos extra',
                desc:  'No importa tu trabajo actual. Si conoces personas con carros, puedes ser aliado.',
                rotate: '8deg',
              },
            ].map((c, i) => (
              <div
                key={i}
                className="relative rounded-2xl overflow-hidden flex flex-col justify-end p-5"
                style={{ backgroundColor: c.bg, minHeight: 200 }}
              >
                {/* Círculo decorativo */}
                <div className="absolute rounded-full bg-white/10"
                  style={{ width: 120, height: 120, top: -30, left: -30 }} />

                {/* Emoji flotante */}
                <div className="absolute select-none leading-none"
                  style={{ top: 16, right: 16, fontSize: 72, transform: `rotate(${c.rotate})`, opacity: 0.9 }}>
                  {c.emoji}
                </div>

                <div className="relative z-10">
                  <h3 className="text-sm font-bold text-white mb-1 leading-tight">{c.title}</h3>
                  <p className="text-xs text-white/60 leading-snug">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA final */}
          <div className="text-center mt-10">
            <p className="text-sm text-gray-500 mb-4">
              Si tienes dudas, regístrate gratis — no hay costo ni compromiso.
            </p>
            <Link to="/registro" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shadow-md shadow-brand/20">
              Regístrate y empieza a ganar
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonios ─────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-2">Testimonios</p>
            <h2 className="text-3xl font-bold text-gray-900">Lo que dicen nuestros aliados</h2>
            <p className="text-gray-500 mt-2 text-sm">Personas reales que ya están ganando comisiones</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIOS.map(t => (
              <div key={t.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} size={14} className="text-accent fill-accent" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQs ────────────────────────────────────────────────── */}
      <section id="preguntas" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-2">FAQ</p>
            <h2 className="text-3xl font-bold text-gray-900">Preguntas frecuentes</h2>
            <p className="text-gray-500 mt-2 text-sm">Todo lo que necesitas saber antes de registrarte</p>
          </div>
          <div className="space-y-3">
            {FAQS.map(f => <FaqItem key={f.q} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── CTA final ───────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-brand rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-accent/10 rounded-full" />
          <div className="relative">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4">Contacto</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Empieza a vender seguros hoy
            </h2>
            <p className="text-white/60 mb-8 max-w-lg mx-auto">
              Regístrate gratis, cotiza desde el primer día y cobra el 1 de cada mes. Sin costos ocultos.
            </p>
            <Link to="/registro" className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg">
              Crear mi cuenta gratis
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-100">

        {/* Main */}
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <LogoFull className="h-10 mb-4" />
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              Somos la red de aliados de Asegura2.com. Conectamos asesores con las mejores aseguradoras del país para que ganen comisiones vendiendo seguros todo riesgo.
            </p>
            <div className="flex items-center gap-3">
              {[
                { label: 'Facebook',  href: 'https://web.facebook.com/asegura2col', svg: <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/> },
                { label: 'Instagram', href: 'https://www.instagram.com/asegura2col/', svg: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/> },
                { label: 'LinkedIn',  href: 'https://www.linkedin.com/company/asegura2colombia', svg: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/> },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-brand-light hover:text-brand flex items-center justify-center text-gray-400 transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">{s.svg}</svg>
                </a>
              ))}
            </div>
          </div>

          {/* Aliados */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Aliados</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Cómo funciona',   to: '/' },
                { label: 'Para quién es',   to: '/' },
                { label: 'Registrarse',     to: '/registro' },
                { label: 'Iniciar sesión',  to: '/login' },
              ].map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-gray-500 hover:text-brand transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Contacto</h3>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:info@asegura2.com.co" className="text-sm text-gray-500 hover:text-brand transition-colors">
                  info@asegura2.com.co
                </a>
              </li>
              <li className="text-sm text-gray-400">Lun–Vie: 8am – 7pm</li>
            </ul>
          </div>
        </div>

        {/* Asociados a — Cámaras de Comercio */}
        <div className="border-t border-gray-100 py-5">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-6">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Asociados a</span>
            <div className="flex items-center gap-6">
              <img src={imgCcManizales} alt="Cámara de Comercio de Manizales" className="h-10 object-contain opacity-70 hover:opacity-100 transition-opacity" />
              <img src={imgCcCucuta}    alt="Cámara de Comercio de Cúcuta"    className="h-10 object-contain opacity-70 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-100 py-4">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">© 2025 Asegura2.com — Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              {['Política de Privacidad', 'Términos y Condiciones', 'Cookies'].map(l => (
                <a key={l} href="#" className="text-xs text-gray-400 hover:text-brand transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
