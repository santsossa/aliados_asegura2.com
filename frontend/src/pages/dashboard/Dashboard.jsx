import { useState, useEffect, useCallback } from 'react'
import { DollarSign, FileText, Shield, TrendingUp, Sparkles, ChevronRight, MoreHorizontal } from 'lucide-react'
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

// ─── Donut con avatar dentro ──────────────────────────────────────────────────
function DonutRingAvatar({ pct: p = 0, size = 96, stroke = 6, color = '#4f46e5', initials = '?' }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.min(p, 100) / 100) * circ
  const av = size - stroke * 2 - 10
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-block', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: av, height: av, borderRadius: '50%',
        background: 'linear-gradient(135deg,#4f46e5,#2D2A7A)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: Math.round(av * 0.36), fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>
          {initials}
        </span>
      </div>
      <div style={{ position: 'absolute', top: 2, right: -6, background: color, color: '#fff', fontSize: 8.5, fontWeight: 800, borderRadius: 99, padding: '2px 6px', lineHeight: 1.4 }}>
        {p}%
      </div>
    </div>
  )
}

// ─── Period bar chart (3 columnas: 1-10, 11-20, 21-31) ───────────────────────
function PeriodBarChart({ data = [] }) {
  const inc = data.map((d, i) => ({ dia: d.dia, monto: i === 0 ? d.monto : d.monto - data[i-1].monto }))
  const sums = [
    inc.filter(d => d.dia <= 10).reduce((s, d) => s + d.monto, 0),
    inc.filter(d => d.dia > 10 && d.dia <= 20).reduce((s, d) => s + d.monto, 0),
    inc.filter(d => d.dia > 20).reduce((s, d) => s + d.monto, 0),
  ]
  const max = Math.max(...sums, 1)
  const labels = ['1-10', '11-20', '21-31']
  const yTicks = [max, Math.round(max * 0.5), 0]
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 18, height: 80 }}>
        {yTicks.map((v, i) => (
          <span key={i} style={{ fontSize: 9, color: '#9ca3af', lineHeight: 1 }}>
            {v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v/1000)}K` : v}
          </span>
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 62 }}>
          {sums.map((val, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', gap: 3, alignItems: 'flex-end', height: '100%' }}>
              <div style={{ flex: 1, background: '#c4b5fd', borderRadius: '3px 3px 0 0', height: `${Math.max((val/max)*65, val>0?8:2)}%` }} />
              <div style={{ flex: 1, background: '#4f46e5', borderRadius: '3px 3px 0 0', height: `${Math.max((val/max)*100, val>0?12:3)}%` }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 5 }}>
          {labels.map((l, i) => <span key={i} style={{ flex: 1, fontSize: 9, color: '#9ca3af', textAlign: 'center' }}>{l}</span>)}
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
      label: 'Próximo pago',
      value: fmt(stats.proximo_pago.monto ?? 0),
      badge: stats.proximo_pago.dias_restantes !== null ? `En ${stats.proximo_pago.dias_restantes} días` : null,
      badgeBg: '#dcfce7', badgeColor: '#16a34a',
      sub: stats.proximo_pago.mes
        ? `1 de ${MESES[stats.proximo_pago.mes - 1]}, ${stats.proximo_pago.anio}`
        : 'Sin pagos pendientes',
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
      label: 'Total ganado histórico',
      value: fmt(stats.total_ganado.monto),
      badge: null,
      sub: `${pct(stats.total_ganado.variacion)} vs. el mes anterior`,
      showArrow: true, positive: stats.total_ganado.variacion >= 0,
      spark: sparklines.ganancias, sparkColor: '#ea580c',
    },
  ]

  return (
    <div className="p-4 lg:p-6" style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

          {/* ═══ LEFT COLUMN ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* 1. Hero banner */}
            <div style={{
              background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 60%, #6366f1 100%)',
              borderRadius: 18, padding: '28px 32px',
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

              <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#c7d2fe', letterSpacing: 1.2, textTransform: 'uppercase' }}>Portal de aliados</p>
              <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.25, maxWidth: 340 }}>
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

            {/* 2. Stats pills — compact horizontal like reference */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {cards.map((c, i) => {
                const Icon = c.icon
                return (
                  <div key={i} style={{
                    background: '#fff',
                    borderRadius: 999,
                    border: '1px solid #eeeeef',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    padding: '10px 12px 10px 10px',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: c.iconBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={17} color={c.iconColor} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 1px', fontSize: 10, color: '#9ca3af', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.value}{c.badge ? ` · ${c.badge}` : ''}
                      </p>
                      <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.label}
                      </p>
                    </div>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0, color: '#d1d5db', display: 'flex' }}>
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* 3. Enviadas a emitir — full card, row list */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eeeeef', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Enviadas a emitir</span>
                <button onClick={() => navigate('/dashboard/mis-polizas')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#7c3aed', fontWeight: 500 }}>
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
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < polizas_proceso.length - 1 ? '1px solid #f9fafb' : 'none', cursor: 'pointer', transition: 'background 0.12s' }}
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

            {/* 4. Actividad reciente — full card, row list */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eeeeef', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Actividad reciente</span>
                <button onClick={() => navigate('/dashboard/cotizaciones')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#7c3aed', fontWeight: 500 }}>
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
                  <button onClick={() => navigate('/dashboard/cotizar')} style={{ background: '#2D2A7A', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Nueva cotización →
                  </button>
                </div>
              ) : (
                <div>
                  {actividad.map((a, i) => {
                    const badge  = getBadge(a.estado, a.tipo)
                    const nombre = a.cliente_nombre || 'Sin nombre'
                    const sub    = (a.tipo === 'cotizacion')
                      ? (a.aseguradora && a.aseguradora !== '—' ? `Placa: ${a.aseguradora}` : 'Sin placa')
                      : (a.aseguradora || '—')
                    return (
                      <div
                        key={`${a.tipo}-${a.id}-${i}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < actividad.length - 1 ? '1px solid #f9fafb' : 'none' }}
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

          {/* ═══ RIGHT COLUMN — container blanco ═══ */}
          <div style={{ background: '#ffffff', borderRadius: 20, border: '1px solid #e5e7eb', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* 5. Tu rendimiento — card gris */}
            <div style={{ background: '#f5f7fb', borderRadius: 16, padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Tu rendimiento</span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: '#ffffff', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                  {mesCorto} {anioLabel}
                </span>
              </div>

              {/* Avatar + donut centrado */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12 }}>
                <DonutRingAvatar pct={metaPct} size={96} stroke={6} color="#4f46e5" initials={initials} />
                <p style={{ margin: '10px 0 2px', fontSize: 15, fontWeight: 700, color: '#111827', textAlign: 'center' }}>
                  {saludo}, {nombreAliado}! 🔥
                </p>
                <p style={{ margin: 0, fontSize: 11, color: '#6b7280', textAlign: 'center', lineHeight: 1.5 }}>
                  {metaPct >= 100 ? '¡Meta del mes superada!' : 'Sigue así para alcanzar tu meta'}
                </p>
              </div>

              {/* Comisiones */}
              <div style={{ background: '#ffffff', borderRadius: 10, padding: '10px 14px', marginBottom: 14, border: '1px solid #e9eaed' }}>
                <p style={{ margin: '0 0 2px', fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>Comisiones generadas · {mesCorto}</p>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>{fmt(rendimiento.comisiones_mes)}</span>
              </div>

              {/* Period bar chart */}
              <PeriodBarChart data={rendimiento.grafica} />

              <button
                onClick={() => navigate('/dashboard/pagos')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#4f46e5', fontWeight: 600, padding: '10px 0 0', display: 'block' }}
              >
                Ver reporte completo →
              </button>
            </div>

            {/* 6. Tu copiloto — card gris, lista estilo mentor */}
            <div style={{ background: '#f5f7fb', borderRadius: 16, padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Tu copiloto</span>
                <button
                  onClick={() => document.querySelector('[data-anto-pill]')?.click()}
                  style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#374151', lineHeight: 1 }}
                >+</button>
              </div>

              {/* Lista de acciones — estilo "Your mentor" */}
              {[
                { bg: '#ede9fe', color: '#4f46e5', emoji: '🛡️', title: 'Coberturas',           sub: 'Qué cubre la póliza'      },
                { bg: '#e0f2fe', color: '#0284c7', emoji: '⚖️', title: 'Comparar aseguradoras', sub: 'Diferencias y precios'    },
                { bg: '#dcfce7', color: '#16a34a', emoji: '💬', title: 'Responder al cliente',  sub: 'Dudas frecuentes'         },
                { bg: '#fff7ed', color: '#ea580c', emoji: '📋', title: 'Exclusiones',            sub: 'Qué NO cubre la póliza'  },
              ].map((item, i, arr) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: i < arr.length - 1 ? 12 : 0, marginBottom: i < arr.length - 1 ? 12 : 0, borderBottom: i < arr.length - 1 ? '1px solid #e9eaed' : 'none' }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                    {item.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 1px', fontSize: 12, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</p>
                    <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>Anto IA</p>
                  </div>
                  <button
                    onClick={() => document.querySelector('[data-anto-pill]')?.click()}
                    style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, color: item.color, background: item.bg, border: `1px solid ${item.color}22`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}
                  >
                    Preguntar
                  </button>
                </div>
              ))}

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginTop: 12 }}>
                <button
                  onClick={() => document.querySelector('[data-anto-pill]')?.click()}
                  style={{ width: '100%', background: '#2D2A7A', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
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
