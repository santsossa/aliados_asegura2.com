import { useState, useEffect, useCallback } from 'react'
import { DollarSign, FileText, Shield, TrendingUp, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSSE } from '../../context/SSEContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function fmt(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}
function pct(n) {
  return `${n >= 0 ? '+' : ''}${n}%`
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

// ─── Avatar círculo simple ────────────────────────────────────────────────────
function PlainAvatar({ size = 80, initials = '?' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg,#4f46e5,#2D2A7A)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ fontSize: Math.round(size * 0.36), fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>
        {initials}
      </span>
    </div>
  )
}

// ─── Period bar chart — pólizas enviadas a emitir por período ─────────────────
function PeriodBarChart({ polizas = [] }) {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const currMonth = now.getMonth()
  const currYear  = now.getFullYear()

  const counts = [0, 0, 0]
  polizas.forEach(p => {
    if (!p.created_at) return
    const d = new Date(p.created_at)
    if (d.getMonth() !== currMonth || d.getFullYear() !== currYear) return
    const day = d.getDate()
    if (day <= 10) counts[0]++
    else if (day <= 20) counts[1]++
    else counts[2]++
  })

  const max = Math.max(...counts, 0)
  const labels = ['1-10', '11-20', `21-${lastDay}`]
  // Y-axis ticks: deduped, meaningful scale
  const yTicks = max === 0 ? [0]
    : max === 1 ? [1, 0]
    : max === 2 ? [2, 1, 0]
    : [max, Math.round(max / 2), 0]

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {/* Y-axis */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 80, paddingBottom: 18, width: 16, flexShrink: 0 }}>
        {yTicks.map((v, i) => (
          <span key={i} style={{ fontSize: 8.5, fontFamily: 'Inter', color: '#9ca3af', lineHeight: 1, textAlign: 'right', display: 'block' }}>{v}</span>
        ))}
      </div>
      {/* Bars */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 62 }}>
          {counts.map((val, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 0 }}>
              {val > 0 && (
                <span style={{ fontSize: 9, fontFamily: 'Inter', fontWeight: 700, color: '#4f46e5', marginBottom: 3 }}>{val}</span>
              )}
              <div style={{
                width: '60%', background: '#4f46e5', borderRadius: '8px 8px 4px 4px',
                height: `${max > 0 ? Math.max((val / max) * 100, val > 0 ? 20 : 4) : 4}%`,
                minHeight: val > 0 ? 14 : 3,
                transition: 'height 0.4s ease',
                opacity: val > 0 ? 1 : 0.15,
              }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          {labels.map((l, i) => (
            <span key={i} className="t-label" style={{ flex: 1, textAlign: 'center', color: '#9ca3af', fontFamily: 'Inter' }}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  const pulse = {
    background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)',
    backgroundSize: '200% 100%',
    animation: 'pulse 1.5s infinite',
    borderRadius: 8,
  }
  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ ...pulse, height: 148, borderRadius: 18 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ ...pulse, height: 130, borderRadius: 14 }} />)}
          </div>
          <div style={{ ...pulse, height: 180, borderRadius: 16 }} />
          <div style={{ ...pulse, height: 240, borderRadius: 16 }} />
        </div>
        <div style={{ ...pulse, height: 520, borderRadius: 18 }} />
      </div>
      <style>{`@keyframes pulse{0%,100%{background-position:200% 0}50%{background-position:-200% 0}}`}</style>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { getToken, user } = useAuth()
  const { subscribe }      = useSSE()
  const navigate           = useNavigate()
  const [data, setData]    = useState(null)
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

  if (loading) return <LoadingSkeleton />
  if (!data) return <div style={{ padding: '20px 24px', color: '#6b7280', fontSize: 14 }}>No se pudo cargar el dashboard.</div>

  const { stats, actividad, rendimiento, sparklines, polizas_proceso = [] } = data
  const nowDate      = new Date()
  const mesLabel     = MESES[nowDate.getMonth()]
  const mesCorto     = MESES_CORTO[nowDate.getMonth()]
  const anioLabel    = nowDate.getFullYear()
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
    <div className="db-outer">
      <div className="db-inner">
        <div className="db-grid">

          {/* ═══ LEFT COLUMN — scrolls ═══ */}
          <div className="db-left">

            {/* 1. Hero banner */}
            <div style={{
              background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 60%, #6366f1 100%)',
              borderRadius: 24, padding: '28px 32px',
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
              <h2 style={{ margin: '0 0 20px', fontFamily: 'Poppins', fontWeight: 500, fontSize: 22, color: '#fff', lineHeight: 1.35, maxWidth: '52%' }}>
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
                    borderRadius: 22,
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

            {/* 3. Enviadas a emitir — full card, row list */}
            <div style={{ background: '#fff', borderRadius: 22, overflow: 'hidden', boxShadow: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: 'none' }}>
                <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 14, color: '#111827' }}>Enviadas a emitir</span>
                <button onClick={() => navigate('/dashboard/mis-polizas')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, color: '#7c3aed', fontWeight: 500 }}>
                  Ver todas →
                </button>
              </div>
              {polizas_proceso.length === 0 ? (
                <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>Aún no has enviado ninguna cotización a emitir.</p>
                </div>
              ) : (
                <div>
                  {polizas_proceso.map((p, i) => {
                    const cfg = getPcfg(p.estado)
                    return (
                      <div
                        key={p.id}
                        onClick={() => navigate('/dashboard/mis-polizas')}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: 'none', cursor: 'pointer', transition: 'background 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 16 }}>🚗</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.cliente_nombre || 'Sin nombre'}
                          </p>
                          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
                            {p.placa || '—'} · {p.aseguradora || '—'} · {p.hace}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {p.valor_comision > 0 && (
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>+{fmt(p.valor_comision)}</span>
                          )}
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
                            {cfg.label}
                          </span>
                          <ChevronRight size={14} color="#d1d5db" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 4. Actividad reciente — flex:1, solo la lista scrollea */}
            <div style={{ background: '#fff', borderRadius: 22, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 180 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 14, color: '#111827' }}>Actividad reciente</span>
                <button onClick={() => navigate('/dashboard/cotizaciones')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, color: '#7c3aed', fontWeight: 500 }}>
                  Ver todas →
                </button>
              </div>
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
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
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

          {/* ═══ RIGHT COLUMN — fija, no scrollea ═══ */}
          <div className="db-right" style={{ background: '#ffffff', borderRadius: 20, padding: 12 }}>

            {/* 5. Tu rendimiento — flex:3, desde arriba */}
            <div style={{ flex: 3, padding: '22px 16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 14, color: '#111827' }}>Tu rendimiento</span>
                <span style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 99, background: '#f5f7fb', color: '#9ca3af' }}>
                  {mesCorto} {anioLabel}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flex: 1, justifyContent: 'center' }}>
                <PlainAvatar size={84} initials={initials} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 8px', fontFamily: 'Poppins', fontSize: 16, fontWeight: 600, color: '#111827' }}>
                    {saludo}, {nombreAliado}! 🔥
                  </p>
                  <p style={{ margin: 0, fontFamily: 'Inter', fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                    Sigue enviando clientes a emitir<br />para generar más comisiones
                  </p>
                </div>
              </div>
            </div>

            {/* 6. Enviadas a emitir — flex:1.8, chart anclado abajo */}
            <div style={{ flex: 1.8, background: '#f5f7fb', borderRadius: 20, padding: '14px 16px', margin: '0 4px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0, flexShrink: 0 }}>
                <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 13, color: '#111827' }}>Enviadas a emitir</span>
                <span style={{ fontFamily: 'Inter', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 99, background: '#ffffff', color: '#9ca3af' }}>
                  {mesCorto}
                </span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ width: '100%' }}>
                  <PeriodBarChart polizas={polizas_proceso} />
                </div>
              </div>
            </div>

            {/* 7. Pregúntale a Anto — flex:1 */}
            <div style={{ flex: 1, background: '#f5f7fb', borderRadius: 20, padding: '14px 16px', margin: '4px 4px 4px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 13, color: '#111827' }}>Pregúntale a Anto</span>
                <button
                  onClick={() => document.querySelector('[data-anto-pill]')?.click()}
                  style={{ width: 24, height: 24, borderRadius: '50%', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#374151', lineHeight: 1, border: 'none' }}
                >+</button>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  {[
                    { bg: '#ede9fe', color: '#4f46e5', emoji: '🛡️', title: 'Coberturas',           },
                    { bg: '#e0f2fe', color: '#0284c7', emoji: '⚖️', title: 'Comparar aseguradoras', },
                    { bg: '#dcfce7', color: '#16a34a', emoji: '💬', title: 'Responder al cliente',  },
                  ].map((item, i, arr) => (
                    <div
                      key={i}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid #eaedf2' : 'none' }}
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
                  style={{ width: '100%', fontFamily: 'Poppins', background: '#2D2A7A1a', color: '#2D2A7A', border: 'none', borderRadius: 999, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s', marginTop: 14 }}
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
    </div>
  )
}
