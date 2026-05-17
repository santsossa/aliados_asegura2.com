import { useState, useEffect } from 'react'
import { DollarSign, FileText, Shield, TrendingUp, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// ─── Format helpers ──────────────────────────────────────────────────────────
function fmt(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}
function pct(n) {
  return `${n >= 0 ? '+' : ''}${n}%`
}

// ─── Badge colours ───────────────────────────────────────────────────────────
const BADGE = {
  enviada:       { bg: '#dbeafe', color: '#1d4ed8', label: 'Enviada'      },
  aprobada:      { bg: '#dcfce7', color: '#16a34a', label: 'Aprobada'     },
  en_proceso:    { bg: '#fef3c7', color: '#d97706', label: 'En proceso'   },
  no_convertida: { bg: '#fee2e2', color: '#dc2626', label: 'No convertida' },
  pendiente:     { bg: '#f3e8ff', color: '#7c3aed', label: 'Pendiente'    },
  procesado:     { bg: '#dcfce7', color: '#16a34a', label: 'Completado'   },
}

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

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

// ─── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({ data = [], color = '#2D2A7A' }) {
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
              cursor: d.monto > 0 ? 'pointer' : 'default',
            }}
          />
        </div>
      ))}
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
      <div style={{ ...pulse, height: 28, width: 200, marginBottom: 8 }} />
      <div style={{ ...pulse, height: 16, width: 300, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[1, 2, 3, 4].map(i => <div key={i} style={{ ...pulse, height: 140, borderRadius: 16 }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 14 }}>
        <div style={{ ...pulse, height: 380, borderRadius: 16 }} />
        <div style={{ ...pulse, height: 380, borderRadius: 16 }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{background-position:200% 0} 50%{background-position:-200% 0} }`}</style>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { getToken, user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/aliados/dashboard`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      credentials: 'include',
    })
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setData(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSkeleton />

  if (!data) {
    return (
      <div style={{ padding: '20px 24px', color: '#6b7280', fontSize: 14 }}>
        No se pudo cargar el dashboard. Intenta recargar la página.
      </div>
    )
  }

  const { stats, actividad, rendimiento, sparklines } = data

  const nowDate = new Date()
  const mesLabel = MESES[nowDate.getMonth()]
  const anioLabel = nowDate.getFullYear()

  const cards = [
    {
      icon: DollarSign,
      iconBg: '#dcfce7',
      iconColor: '#16a34a',
      label: 'Próximo pago',
      value: stats.proximo_pago.monto > 0 ? fmt(stats.proximo_pago.monto) : '—',
      badge: stats.proximo_pago.dias_restantes !== null ? `En ${stats.proximo_pago.dias_restantes} días` : null,
      badgeBg: '#dcfce7',
      badgeColor: '#16a34a',
      sub: stats.proximo_pago.mes
        ? `1 de ${MESES[stats.proximo_pago.mes - 1]}, ${stats.proximo_pago.anio}`
        : 'Sin pagos pendientes',
      showArrow: false,
      spark: sparklines.ganancias,
      sparkColor: '#16a34a',
    },
    {
      icon: FileText,
      iconBg: '#dbeafe',
      iconColor: '#2563eb',
      label: 'Cotizaciones este mes',
      value: String(stats.cotizaciones_mes.total),
      badge: null,
      sub: `${pct(stats.cotizaciones_mes.variacion)} vs. el mes anterior`,
      showArrow: true,
      positive: stats.cotizaciones_mes.variacion >= 0,
      spark: sparklines.cotizaciones,
      sparkColor: '#2563eb',
    },
    {
      icon: Shield,
      iconBg: '#ede9fe',
      iconColor: '#7c3aed',
      label: 'Pólizas aprobadas',
      value: String(stats.polizas_mes.total),
      badge: null,
      sub: `${pct(stats.polizas_mes.variacion)} vs. el mes anterior`,
      showArrow: true,
      positive: stats.polizas_mes.variacion >= 0,
      spark: sparklines.polizas,
      sparkColor: '#7c3aed',
    },
    {
      icon: TrendingUp,
      iconBg: '#fff7ed',
      iconColor: '#ea580c',
      label: 'Total ganado histórico',
      value: fmt(stats.total_ganado.monto),
      badge: null,
      sub: `${pct(stats.total_ganado.variacion)} vs. el mes anterior`,
      showArrow: true,
      positive: stats.total_ganado.variacion >= 0,
      spark: sparklines.ganancias,
      sparkColor: '#ea580c',
    },
  ]

  const comPct = rendimiento.meta_mes > 0
    ? Math.min(100, Math.round((rendimiento.comisiones_mes / rendimiento.meta_mes) * 100))
    : 0

  // X-axis tick labels for bar chart
  const tickDias = [1, 8, 15, 22, 29]

  return (
    <div style={{ padding: '24px 32px', height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
      {/* Greeting */}
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>
        Hola, {user?.nombre || 'aliado'} 👋
      </h1>
      <p style={{ margin: '4px 0 20px', fontSize: 13, color: '#9ca3af' }}>
        Resumen de tu actividad · {mesLabel} {anioLabel}
      </p>

      {/* ── Row 1: Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 16 }}>
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div
              key={c.label}
              style={{
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #eeeeef',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 140,
              }}
            >
              {/* Card body */}
              <div style={{ padding: '16px 16px 10px', flex: 1 }}>
                {/* Icon + label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: c.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={16} color={c.iconColor} />
                  </div>
                  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, lineHeight: 1.3 }}>{c.label}</span>
                </div>

                {/* Value + badge */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{c.value}</span>
                  {c.badge && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
                      background: c.badgeBg, color: c.badgeColor,
                    }}>
                      {c.badge}
                    </span>
                  )}
                </div>

                {/* Sub text with optional arrow */}
                <p style={{ margin: '6px 0 0', fontSize: 11, color: c.showArrow ? (c.positive ? '#16a34a' : '#dc2626') : '#9ca3af' }}>
                  {c.showArrow && (
                    <span style={{ marginRight: 2 }}>{c.positive ? '↗' : '↘'}</span>
                  )}
                  {c.sub}
                </p>
              </div>

              {/* Sparkline flush to bottom */}
              <div style={{ marginTop: 'auto' }}>
                <Sparkline data={c.spark} color={c.sparkColor} height={44} />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Row 2: Actividad + Rendimiento ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>

        {/* Actividad reciente */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #eeeeef',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
          }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Actividad reciente</span>
            <button
              onClick={() => navigate('/dashboard/cotizaciones')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#7c3aed', fontWeight: 500 }}
            >
              Ver todas →
            </button>
          </div>

          {/* List */}
          {actividad.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              Sin actividad reciente
            </div>
          ) : (
            <div>
              {actividad.map((a, i) => {
                const isLead = a.tipo === 'lead'
                const badge = BADGE[a.estado] || { bg: '#f3f4f6', color: '#6b7280', label: a.estado }
                const Icon = isLead ? FileText : Shield
                const iconBg = isLead ? '#dbeafe' : '#ede9fe'
                const iconColor = isLead ? '#2563eb' : '#7c3aed'
                const title = isLead ? `Cotización para ${a.cliente_nombre}` : `Póliza ${a.cliente_nombre}`
                return (
                  <div
                    key={`${a.tipo}-${a.id}-${i}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 20px',
                      borderBottom: i < actividad.length - 1 ? '1px solid #f9fafb' : 'none',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={16} color={iconColor} />
                    </div>

                    {/* Title + aseguradora */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {title}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{a.aseguradora || '—'}</div>
                    </div>

                    {/* Time */}
                    <div style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {a.hace}
                    </div>

                    {/* Badge */}
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                      background: badge.bg, color: badge.color, whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {badge.label}
                    </span>

                    {/* Amount + chevron */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      {a.monto > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                          {fmt(a.monto)}
                        </span>
                      )}
                      <ChevronRight size={14} color="#d1d5db" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Tu rendimiento */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #eeeeef',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Tu rendimiento</span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
              background: '#f3f4f6', color: '#6b7280',
            }}>
              Este mes
            </span>
          </div>

          {/* Meta mensual */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
                  {fmt(rendimiento.comisiones_mes)}
                </span>
                <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 4 }}>
                  / {fmt(rendimiento.meta_mes)}
                </span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#2D2A7A' }}>{comPct}%</span>
            </div>
            <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${comPct}%`,
                background: '#2D2A7A',
                borderRadius: 99,
                transition: 'width 0.6s ease',
              }} />
            </div>
            <p style={{ margin: '5px 0 0', fontSize: 11, color: '#9ca3af' }}>
              Meta mensual de comisiones
            </p>
          </div>

          {/* Bar chart */}
          <div>
            <BarChart data={rendimiento.grafica} color="#2D2A7A" />
            {/* X-axis ticks */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, paddingLeft: 0 }}>
              {tickDias.map(dia => {
                // approximate position as % of total days
                const totalDias = rendimiento.grafica.length || 30
                const left = ((dia - 1) / (totalDias - 1)) * 100
                return (
                  <span key={dia} style={{ fontSize: 10, color: '#9ca3af' }}>{dia}</span>
                )
              })}
            </div>
          </div>

          {/* Footer link */}
          <div style={{ marginTop: 'auto' }}>
            <button
              onClick={() => navigate('/dashboard/pagos')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#2D2A7A', fontWeight: 600, padding: 0 }}
            >
              Ver reporte completo →
            </button>
          </div>
        </div>
      </div>
      </div>  {/* max-width wrapper */}
    </div>
  )
}
