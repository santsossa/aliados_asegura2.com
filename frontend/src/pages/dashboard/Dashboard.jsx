import { useState, useEffect, useCallback, useRef } from 'react'
import { DollarSign, FileText, Shield, TrendingUp, ChevronRight, ChevronLeft, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSSE } from '../../context/SSEContext'
import { getAvatarSrc } from '../../utils/avatars'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const LOGO_MAP = {
  allianz: '/logos/allianz.webp', axa: '/logos/axa.webp',
  bolivar: '/logos/bolivar.webp', equidad: '/logos/equidad.webp',
  hdi: '/logos/hdi.webp', mapfre: '/logos/mapfre.webp',
  sbs: '/logos/sbs.webp', solidaria: '/logos/solidaria.webp',
  sura: '/logos/sura.webp', estado: '/logos/estado.webp',
  coomeva: '/logos/coomeva.webp', qualitas: '/logos/qualitas.webp',
}
function getLogoUrl(nombre) {
  if (!nombre) return null
  const key = nombre.toLowerCase()
  const match = Object.keys(LOGO_MAP).find(k => key.includes(k))
  return match ? LOGO_MAP[match] : null
}

function fmt(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}
function pct(n) {
  return `${n >= 0 ? '+' : ''}${n}%`
}
function fmtShort(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000 % 1 === 0 ? (n/1_000_000).toFixed(0) : (n/1_000_000).toFixed(1))}M`
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}k`
  return `$${n}`
}

const BADGE = {
  activa:        { bg: '#dbeafe', color: '#1d4ed8', label: 'Cotizada'         },
  enviada:       { bg: '#dcfce7', color: '#16a34a', label: 'Enviada a emitir' },
  cerrada:       { bg: '#f3f4f6', color: '#6b7280', label: 'Cerrada'          },
  lead:          { bg: '#dcfce7', color: '#16a34a', label: 'Enviada a emitir' },
  en_proceso:    { bg: '#fef3c7', color: '#d97706', label: 'En proceso'       },
  aprobada:      { bg: '#d1fae5', color: '#065f46', label: 'Aprobada'         },
  no_convertida: { bg: '#fee2e2', color: '#dc2626', label: 'No aprobado'      },
  procesado:     { bg: '#d1fae5', color: '#065f46', label: 'Completado'       },
}
function getBadge(estado, tipo) {
  if (tipo === 'lead') return BADGE.lead
  return BADGE[estado] || { bg: '#f3f4f6', color: '#6b7280', label: estado || '—' }
}

const POLIZA_CFG = {
  en_proceso:    { bg: '#fef3c7', color: '#92400e', label: 'En proceso'  },
  aprobada:      { bg: '#d1fae5', color: '#065f46', label: 'Aprobada'    },
  no_convertida: { bg: '#fee2e2', color: '#991b1b', label: 'No aprobado' },
}
function getPcfg(estado) {
  return POLIZA_CFG[estado] || { bg: '#f3f4f6', color: '#374151', label: estado }
}

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

// ─── Sparkline ───────────────────────────────────────────────────────────────
function Sparkline({ data = [], color = '#2D2A7A', height = 44 }) {
  if (data.length < 2) {
    return (
      <svg viewBox="0 0 100 44" width="100%" height={height} preserveAspectRatio="none">
        <line x1="0" y1="22" x2="100" y2="22" stroke={color} strokeWidth="1.5" strokeOpacity="0.3" />
      </svg>
    )
  }
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const range = max - min || 1
  const W = 100, H = height
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - 4 - ((v - min) / range) * (H - 8),
  ])
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i - 1][0] + pts[i][0]) / 2
    d += ` C${cx},${pts[i - 1][1]} ${cx},${pts[i][1]} ${pts[i][0]},${pts[i][1]}`
  }
  const area = `${d} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`
  const gradId = `sg-${color.replace('#', '')}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Bar chart (one bar per day, cumulative) ──────────────────────────────────
function BarChart({ data = [], color = '#2D2A7A' }) {
  if (!data.length) {
    return (
      <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>Sin datos aún</span>
      </div>
    )
  }
  const max = Math.max(...data.map(d => d.monto), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 100, width: '100%' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div
            title={`Día ${d.dia}: ${fmt(d.monto)}`}
            style={{
              width: '100%',
              height: `${Math.max((d.monto / max) * 100, d.monto > 0 ? 4 : 2)}%`,
              background: color,
              opacity: d.monto > 0 ? 0.75 + (d.monto / max) * 0.25 : 0.12,
              borderRadius: '3px 3px 0 0',
              transition: 'opacity 0.2s',
            }}
          />
        </div>
      ))}
    </div>
  )
}

// ─── Avatar círculo ───────────────────────────────────────────────────────────
function AvatarCircle({ avatarId, size = 80, initials = '?' }) {
  const src = getAvatarSrc(avatarId)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
      background: 'linear-gradient(135deg, #e8e6ff 0%, #c7d2fe 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {src
        ? <img src={src} alt="avatar" width={size} height={size}
            style={{ width: '90%', height: '90%', objectFit: 'contain', objectPosition: 'center center' }}
            decoding="async" fetchpriority="high" />
        : <span style={{ fontSize: Math.round(size * 0.36), fontWeight: 900, color: '#6366f1', textTransform: 'uppercase' }}>{initials}</span>
      }
    </div>
  )
}

// ─── Monthly commissions chart — last 3 months with dotted reference lines ────
function MonthlyCommissionsChart({ meses = [] }) {
  const max = Math.max(...meses.map(m => m.valor), 1)
  const yMid = Math.round(max / 2)
  const CHART_H = 104

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {/* Y-axis */}
      <div style={{ width: 44, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: CHART_H + 22, paddingBottom: 22 }}>
        {[max, yMid, 0].map((v, i) => (
          <span key={i} style={{ fontSize: 8.5, fontFamily: 'Inter', color: '#9ca3af', textAlign: 'right', display: 'block', lineHeight: 1 }}>
            {v === 0 ? '0' : fmtShort(v)}
          </span>
        ))}
      </div>
      {/* Bars + dotted lines */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Dotted reference lines */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: CHART_H, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: 0,     left: 0, right: 0, borderTop: '1px dashed #e2e4ea' }} />
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dashed #e2e4ea' }} />
        </div>
        {/* Bars */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: CHART_H, position: 'relative' }}>
          {meses.map((m, i) => {
            const isCurrent = i === meses.length - 1
            const pct = max > 0 ? Math.max((m.valor / max) * 100, m.valor > 0 ? 12 : 3) : 3
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                {m.valor > 0 && (
                  <span style={{ fontSize: 9, fontFamily: 'Inter', fontWeight: 700, color: isCurrent ? '#4f46e5' : '#9ca3af', marginBottom: 3 }}>
                    {fmtShort(m.valor)}
                  </span>
                )}
                <div style={{
                  width: '68%',
                  background: isCurrent ? '#4f46e5' : '#c7d2fe',
                  borderRadius: '8px 8px 4px 4px',
                  height: `${pct}%`,
                  minHeight: m.valor > 0 ? 10 : 3,
                  opacity: m.valor > 0 ? 1 : 0.25,
                  transition: 'height 0.4s ease',
                }} />
              </div>
            )
          })}
        </div>
        {/* X-axis labels */}
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          {meses.map((m, i) => {
            const isCurrent = i === meses.length - 1
            return (
              <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9.5, fontFamily: 'Inter', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isCurrent ? '#4f46e5' : '#9ca3af' }}>
                {m.mes}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  const B = '#f0f1f3'
  const s = (r,h,w='100%',extra={}) => (
    <div style={{ background:B, borderRadius:r, height:h, width:w, flexShrink:0, ...extra }} />
  )
  return (
    <div className="db-inner" style={{ animation:'skpulse 1.5s ease-in-out infinite' }}>
      <style>{`@keyframes skpulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
      <div className="db-grid">
        {/* Left */}
        <div className="db-left">
          {/* Hero */}
          {s(28, 148)}
          {/* 4 stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
            {[0,1,2,3].map(i => (
              <div key={i} style={{ background:'#fff', borderRadius:24, padding:'15px 16px', display:'flex', alignItems:'center', gap:12 }}>
                {s(50, 40, 40)}
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7 }}>
                  {s(5, 10, '70%')}
                  {s(5, 14, '55%')}
                </div>
              </div>
            ))}
          </div>
          {/* Enviadas a emitir */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 4px', marginBottom:12 }}>
              {s(6, 14, 110)}
              <div style={{ display:'flex', gap:6 }}>{s(50,28,28)}{s(50,28,28)}</div>
            </div>
            <div style={{ background:'#fff', borderRadius:24, padding:12 }}>
              <div style={{ display:'flex', gap:12, minHeight:192 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ minWidth:170, maxWidth:170, background:'#f5f7fb', borderRadius:20, overflow:'hidden', flexShrink:0 }}>
                    <div style={{ height:96, background:'#fff' }} />
                    <div style={{ padding:'11px 13px 13px', display:'flex', flexDirection:'column', gap:7 }}>
                      {s(99, 20, 64)}
                      {s(5, 13, '80%')}
                      {s(5, 11, '50%')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Actividad reciente */}
          <div>
            <div style={{ padding:'0 4px', marginBottom:10 }}>{s(6, 14, 120)}</div>
            <div style={{ background:'#fff', borderRadius:24 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px' }}>
                  {s(10, 36, 36)}
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                    {s(5, 13, '52%')}
                    {s(5, 11, '35%')}
                  </div>
                  {s(6, 11, 52)}
                  {s(99, 22, 76)}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Right */}
        <div className="db-right">
          {/* Tu rendimiento */}
          <div style={{ background:'#fff', borderRadius:22, padding:'22px 16px 18px', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
            {s(50, 92, 92)}
            {s(6, 14, '60%')}
            {s(6, 12, '45%')}
          </div>
          {/* Comisiones */}
          <div style={{ background:'#fff', borderRadius:22, padding:'14px 14px 12px', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2px' }}>
              {s(6, 14, 90)}
              {s(99, 22, 72)}
            </div>
            <div style={{ background:'#f5f7fb', borderRadius:16, padding:'14px 16px' }}>
              <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:104 }}>
                {[55,35,75,45,90,60].map((h,i) => (
                  <div key={i} style={{ flex:1, height:`${h}%`, background:B, borderRadius:'5px 5px 3px 3px' }} />
                ))}
              </div>
              <div style={{ display:'flex', marginTop:6, gap:6 }}>
                {[0,1,2,3,4,5].map(i => <div key={i} style={{ flex:1, ...{background:B, borderRadius:4, height:8} }} />)}
              </div>
            </div>
            {/* Anto section placeholder */}
            <div style={{ padding:'10px 2px 0' }}>{s(6, 14, 130)}</div>
            {[0,1,2].map(i => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#f9fafb', borderRadius:12 }}>
                {s(10, 32, 32)}
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:5 }}>
                  {s(5, 12, '65%')}
                  {s(5, 10, '45%')}
                </div>
                {s(99, 24, 72)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { getToken, user, avatarId } = useAuth()
  const { subscribe }      = useSSE()
  const navigate           = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    fetch(`${API}/api/aliados/dashboard`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      credentials: 'include',
    })
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setData(d.data) })
      .catch(() => {})
      .finally(() => { if (!silent) setLoading(false) })
  }, [getToken])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])
  useEffect(() => { return subscribe('poliza_update', () => fetchDashboard(true)) }, [subscribe, fetchDashboard])
  const enviRef = useRef(null)

  if (loading) return <LoadingSkeleton />
  if (!data) return <div style={{ padding: '20px 24px', color: '#6b7280', fontSize: 14 }}>No se pudo cargar el dashboard.</div>

  const { stats, actividad, rendimiento, sparklines, polizas_proceso = [] } = data
  const nowDate      = new Date()
  const mesLabel     = MESES[nowDate.getMonth()]
  const mesCorto     = MESES_CORTO[nowDate.getMonth()]
  const anioLabel    = nowDate.getFullYear()
  const m0idx        = nowDate.getMonth()
  const m1idx        = (m0idx - 1 + 12) % 12
  const m2idx        = (m0idx - 2 + 12) % 12
  const comisionActual   = rendimiento.comisiones_mes || 0
  const varPct           = stats.total_ganado?.variacion || 0
  const comisionAnterior = comisionActual > 0 && varPct !== 0
    ? Math.round(comisionActual / (1 + varPct / 100))
    : 0
  const chartMeses = [
    { mes: MESES_CORTO[m2idx], valor: 0 },
    { mes: MESES_CORTO[m1idx], valor: comisionAnterior },
    { mes: MESES_CORTO[m0idx], valor: comisionActual },
  ]
  const nombreAliado = user?.nombre || 'aliado'
  const apellido     = user?.apellido || ''
  const initials     = ((nombreAliado[0] || '') + (apellido[0] || '')).toUpperCase() || '?'
  const hora         = new Date().getHours()
  const saludo       = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'
  const metaPct      = Math.min(100, Math.round((rendimiento.comisiones_mes / (rendimiento.meta_mes || 5000000)) * 100))
  const tickDias     = [1, 8, 15, 22, 29]

  const cards = [
    {
      icon: DollarSign, iconBg: '#dcfce7', iconColor: '#16a34a',
      label: stats.proximo_pago.mes
        ? `Próximo pago · 1 ${MESES_CORTO[stats.proximo_pago.mes - 1]}`
        : 'Próximo pago',
      value: fmt(stats.proximo_pago.monto ?? 0),
      badge: null,
      sub: stats.proximo_pago.mes ? `1 ${MESES_CORTO[stats.proximo_pago.mes - 1]} ${stats.proximo_pago.anio}` : 'Sin pagos pendientes',
      showArrow: false, spark: sparklines.ganancias, sparkColor: '#16a34a',
    },
    {
      icon: FileText, iconBg: '#dbeafe', iconColor: '#2563eb',
      label: `Cotizaciones · ${mesCorto}`,
      value: String(stats.cotizaciones_mes.total),
      badge: null,
      sub: `${pct(stats.cotizaciones_mes.variacion)} vs. el mes anterior`,
      showArrow: true, positive: stats.cotizaciones_mes.variacion >= 0,
      spark: sparklines.cotizaciones, sparkColor: '#2563eb',
    },
    {
      icon: Shield, iconBg: '#ede9fe', iconColor: '#7c3aed',
      label: `Pólizas aprobadas · ${mesCorto}`,
      value: String(stats.polizas_mes.total),
      badge: null,
      sub: `${pct(stats.polizas_mes.variacion)} vs. el mes anterior`,
      showArrow: true, positive: stats.polizas_mes.variacion >= 0,
      spark: sparklines.polizas, sparkColor: '#7c3aed',
    },
    {
      icon: TrendingUp, iconBg: '#fff7ed', iconColor: '#ea580c',
      label: 'Total ganado',
      value: fmt(stats.total_ganado.monto),
      badge: null,
      sub: `${pct(stats.total_ganado.variacion)} vs. el mes anterior`,
      showArrow: true, positive: stats.total_ganado.variacion >= 0,
      spark: sparklines.ganancias, sparkColor: '#ea580c',
    },
  ]

  return (
    <div className="db-inner">
      <div className="db-grid">

          {/* ═══ LEFT COLUMN — scrolls ═══ */}
          <div className="db-left">

            {/* 1. Hero banner */}
            <div style={{
              background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 60%, #6366f1 100%)',
              borderRadius: 28, padding: '28px 32px',
              position: 'relative', overflow: 'hidden', minHeight: 148,
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}>
              {/* Sparkles decorativos */}
              <svg style={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)', opacity: 0.18, pointerEvents: 'none' }} width="110" height="110" viewBox="0 0 200 200">
                <path d="M100 0 C100 0 108 92 200 100 C200 100 108 108 100 200 C100 200 92 108 0 100 C0 100 92 92 100 0Z" fill="white" />
              </svg>
              <svg style={{ position: 'absolute', right: 70, top: 18, opacity: 0.13, pointerEvents: 'none' }} width="32" height="32" viewBox="0 0 200 200">
                <path d="M100 0 C100 0 108 92 200 100 C200 100 108 108 100 200 C100 200 92 108 0 100 C0 100 92 92 100 0Z" fill="white" />
              </svg>
              <svg style={{ position: 'absolute', right: 150, top: 12, opacity: 0.09, pointerEvents: 'none' }} width="20" height="20" viewBox="0 0 200 200">
                <path d="M100 0 C100 0 108 92 200 100 C200 100 108 108 100 200 C100 200 92 108 0 100 C0 100 92 92 100 0Z" fill="white" />
              </svg>
              <svg style={{ position: 'absolute', right: 18, bottom: 16, opacity: 0.1, pointerEvents: 'none' }} width="26" height="26" viewBox="0 0 200 200">
                <path d="M100 0 C100 0 108 92 200 100 C200 100 108 108 100 200 C100 200 92 108 0 100 C0 100 92 92 100 0Z" fill="white" />
              </svg>
              <svg style={{ position: 'absolute', right: 200, bottom: 20, opacity: 0.07, pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 200 200">
                <path d="M100 0 C100 0 108 92 200 100 C200 100 108 108 100 200 C100 200 92 108 0 100 C0 100 92 92 100 0Z" fill="white" />
              </svg>

              <p style={{ margin: '0 0 8px', fontFamily: 'Inter', fontWeight: 700, fontSize: 9.5, color: '#c7d2fe', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Portal de aliados</p>
              <h2 style={{ margin: '0 0 20px', fontFamily: 'Poppins', fontWeight: 500, fontSize: 22, color: '#fff', lineHeight: 1.35, maxWidth: '72%' }}>
                Cotiza un seguro en segundos y gana tu comisión
              </h2>
              <button
                onClick={() => navigate('/dashboard/cotizar')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  width: 'fit-content',
                  background: '#0f0e1a', border: 'none', borderRadius: 999,
                  cursor: 'pointer', padding: '9px 9px 9px 18px',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Cotizar ahora
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: '#ffffff', fontSize: 16, color: '#0f0e1a', fontWeight: 900, lineHeight: 1 }}>›</span>
              </button>
            </div>

            {/* 2. Stats cards — compactas horizontales */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
              {cards.map((c, i) => {
                const Icon = c.icon
                return (
                  <div key={i} style={{
                    background: '#fff',
                    borderRadius: 24,
                    padding: '15px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={17} color={c.iconColor} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontFamily: 'Inter', fontSize: 11, color: '#9ca3af', lineHeight: 1.4 }}>{c.label}</p>
                      <p style={{ margin: '2px 0 0', fontFamily: 'Poppins', fontSize: 14.5, fontWeight: 600, color: '#111827', letterSpacing: '-0.2px' }}>{c.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 3. Enviadas a emitir — carrusel horizontal */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: 12 }}>
                <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 14, color: '#111827' }}>Enviadas a emitir</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => enviRef.current?.scrollBy({ left: -190, behavior: 'smooth' })}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: '#fff', border: '1.5px solid #e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <ChevronLeft size={13} color="#374151" />
                  </button>
                  <button
                    onClick={() => enviRef.current?.scrollBy({ left: 190, behavior: 'smooth' })}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: '#2D2A7A', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <ChevronRight size={13} color="#fff" />
                  </button>
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: 24, padding: 12 }}>
              <div
                ref={enviRef}
                className="no-scrollbar"
                style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, minHeight: 192 }}
              >
                {polizas_proceso.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 20, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>Aún no has enviado ninguna cotización a emitir.</p>
                  </div>
                ) : polizas_proceso.map((p) => {
                  const cfg  = getPcfg(p.estado)
                  const logo = getLogoUrl(p.aseguradora)
                  return (
                    <div
                      key={p.id}
                      onClick={() => navigate('/dashboard/mis-polizas')}
                      style={{
                        minWidth: 170, maxWidth: 170, flexShrink: 0,
                        background: '#f5f7fb', borderRadius: 20, overflow: 'hidden',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#eceef4'}
                      onMouseLeave={e => e.currentTarget.style.background = '#f5f7fb'}
                    >
                      {/* Área logo — como el thumbnail de la imagen ref */}
                      <div style={{ height: 96, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {logo
                          ? <img src={logo} alt={p.aseguradora} width={128} height={50}
                              style={{ maxHeight: 50, maxWidth: 128, objectFit: 'contain' }}
                              loading="lazy" decoding="async" />
                          : <div style={{ width: 48, height: 48, borderRadius: 14, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🚗</div>
                        }
                      </div>
                      {/* Info */}
                      <div style={{ padding: '11px 13px 13px', display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
                          {cfg.label}
                        </span>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.cliente_nombre || 'Sin nombre'}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.placa || '—'}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 4 }}>
                          {p.valor_comision > 0
                            ? <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>+{fmt(p.valor_comision)}</span>
                            : <span />
                          }
                          <span style={{ fontSize: 10, color: '#b0b4c1' }}>{p.hace}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              </div>
            </div>

            {/* 4. Actividad reciente */}
            <div style={{ marginTop: 8 }}>
              {/* Título fuera del card */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: 10 }}>
                <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 14, color: '#111827' }}>Actividad reciente</span>
                <button onClick={() => navigate('/dashboard/cotizaciones')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>
                  Ver todas →
                </button>
              </div>
              <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 180 }}>
              {actividad.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🚘</div>
                  <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#374151' }}>Aquí verás tu actividad reciente</p>
                  <p style={{ margin: '0 0 16px', fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
                    Empieza creando tu primera cotización<br />en menos de 2 minutos.
                  </p>
                  <button onClick={() => navigate('/dashboard/cotizar')} style={{ background: '#2D2A7A', color: '#fff', border: 'none', borderRadius: 999, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Nueva cotización →
                  </button>
                </div>
              ) : (
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {actividad.map((a, i) => {
                    const badge  = getBadge(a.estado, a.tipo)
                    const nombre = a.cliente_nombre || 'Sin nombre'
                    const sub    = (a.tipo === 'cotizacion')
                      ? (a.aseguradora && a.aseguradora !== '—' ? `Placa: ${a.aseguradora}` : 'Sin placa')
                      : (a.aseguradora || '—')
                    return (
                      <div
                        key={`${a.tipo}-${a.id}-${i}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px' }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: a.estado === 'enviada' ? '#dcfce7' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={16} color={a.estado === 'enviada' ? '#16a34a' : '#2563eb'} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{sub}</div>
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>{a.hace}</div>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: badge.bg, color: badge.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {badge.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
              </div>
            </div>

          </div>

          {/* ═══ RIGHT COLUMN — scrollea junto a la izquierda ═══ */}
          <div className="db-right">

            {/* 5. Tu rendimiento */}
            <div style={{ background: '#fff', borderRadius: 22, padding: '22px 16px 18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <AvatarCircle avatarId={avatarId} size={92} initials={initials} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 6px', fontFamily: 'Poppins', fontSize: 15, fontWeight: 600, color: '#111827' }}>
                    {saludo}, {nombreAliado}! 👋
                  </p>
                  <p style={{ margin: 0, fontFamily: 'Inter', fontSize: 12, color: '#6b7280' }}>
                    Envía a emitir y gana más comisiones
                  </p>
                </div>
              </div>
            </div>

            {/* 6+7. White outer card — Comisiones + Anto */}
            <div style={{ background: '#fff', borderRadius: 22, padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Comisiones — título fuera de la gray card */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 14, color: '#111827' }}>Comisiones</span>
                <span style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 99, background: '#f5f7fb', color: '#9ca3af' }}>
                  {MESES_CORTO[m2idx]} – {mesCorto}
                </span>
              </div>

              {/* Gray inner: chart */}
              <div style={{ background: '#f5f7fb', borderRadius: 16, padding: '14px 16px' }}>
                <MonthlyCommissionsChart meses={chartMeses} />
              </div>

              {/* Pregúntale a Anto — título fuera de la gray card */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 2px 0' }}>
                <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 14, color: '#111827' }}>Pregúntale a Anto</span>
                <button
                  onClick={() => document.querySelector('[data-anto-pill]')?.click()}
                  style={{ width: 24, height: 24, borderRadius: '50%', background: '#f5f7fb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#374151', lineHeight: 1, border: 'none' }}
                >+</button>
              </div>

              {/* Gray inner: Anto opciones */}
              <div style={{ background: '#f5f7fb', borderRadius: 16, padding: '10px 14px 14px' }}>
                <div>
                  {[
                    { bg: '#ede9fe', color: '#4f46e5', emoji: '🛡️', title: 'Coberturas'            },
                    { bg: '#e0f2fe', color: '#0284c7', emoji: '⚖️', title: 'Comparar aseguradoras'  },
                    { bg: '#dcfce7', color: '#16a34a', emoji: '💬', title: 'Responder al cliente'   },
                  ].map((item, i, arr) => (
                    <div
                      key={i}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid #e5e7eb' : 'none' }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15 }}>
                        {item.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontFamily: 'Poppins', fontSize: 12, fontWeight: 500, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</p>
                        <p style={{ margin: 0, fontFamily: 'Inter', fontSize: 10, color: '#9ca3af' }}>Anto IA</p>
                      </div>
                      <button
                        onClick={() => document.querySelector('[data-anto-pill]')?.click()}
                        style={{ flexShrink: 0, fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: item.color, background: `${item.color}15`, border: 'none', borderRadius: 999, padding: '4px 9px', cursor: 'pointer' }}
                      >
                        Preguntar
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => document.querySelector('[data-anto-pill]')?.click()}
                  style={{ width: '100%', fontFamily: 'Poppins', background: '#2D2A7A1a', color: '#2D2A7A', border: 'none', borderRadius: 999, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s', marginTop: 10 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#2D2A7A33'}
                  onMouseLeave={e => e.currentTarget.style.background = '#2D2A7A1a'}
                >
                  Preguntarle a Anto
                </button>
              </div>

            </div>

          </div>

      </div>
    </div>
  )
}
