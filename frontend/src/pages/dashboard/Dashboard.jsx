import { useState, useEffect, useCallback } from 'react'
import { DollarSign, FileText, Shield, TrendingUp, Sparkles, Car } from 'lucide-react'
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
  activa:        { bg: '#dbeafe', color: '#1d4ed8', label: 'Cotizada'          },
  enviada:       { bg: '#dcfce7', color: '#16a34a', label: 'Enviada a emitir'  },
  cerrada:       { bg: '#f3f4f6', color: '#6b7280', label: 'Cerrada'           },
  lead:          { bg: '#dcfce7', color: '#16a34a', label: 'Enviada a emitir'  },
  en_proceso:    { bg: '#fef3c7', color: '#d97706', label: 'En proceso'        },
  aprobada:      { bg: '#d1fae5', color: '#065f46', label: 'Aprobada'          },
  no_convertida: { bg: '#fee2e2', color: '#dc2626', label: 'No aprobado'       },
  procesado:     { bg: '#d1fae5', color: '#065f46', label: 'Completado'        },
}

function getBadge(estado, tipo) {
  if (tipo === 'lead') return BADGE.lead
  return BADGE[estado] || { bg: '#f3f4f6', color: '#6b7280', label: estado || '—' }
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
      <div style={{ ...pulse, height: 24, width: 180, marginBottom: 6 }} />
      <div style={{ ...pulse, height: 32, width: 320, marginBottom: 20 }} />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ ...pulse, height: 148, borderRadius: 18 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ ...pulse, height: 130, borderRadius: 16 }} />)}
          </div>
          <div style={{ ...pulse, height: 280, borderRadius: 16 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ ...pulse, height: 300, borderRadius: 18 }} />
          <div style={{ ...pulse, height: 200, borderRadius: 18 }} />
        </div>
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{background-position:200% 0} 50%{background-position:-200% 0} }
        .hide-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
        .hide-scrollbar::-webkit-scrollbar { display:none; }
      `}</style>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
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

  useEffect(() => {
    return subscribe('poliza_update', () => { fetchDashboard(true) })
  }, [subscribe, fetchDashboard])

  if (loading) return <LoadingSkeleton />

  if (!data) {
    return (
      <div style={{ padding: '20px 24px', color: '#6b7280', fontSize: 14 }}>
        No se pudo cargar el dashboard. Intenta recargar la página.
      </div>
    )
  }

  const { stats, actividad, rendimiento, sparklines, polizas_proceso = [] } = data

  const nowDate   = new Date()
  const mesLabel  = MESES[nowDate.getMonth()]
  const anioLabel = nowDate.getFullYear()

  const cards = [
    {
      icon: DollarSign,
      iconBg: '#dcfce7',
      iconColor: '#16a34a',
      label: 'Próximo pago',
      value: fmt(stats.proximo_pago.monto ?? 0),
      badge: `En ${stats.proximo_pago.dias_restantes} días`,
      badgeBg: '#dcfce7',
      badgeColor: '#16a34a',
      sub: `1 de ${MESES[stats.proximo_pago.mes - 1]}, ${stats.proximo_pago.anio}`,
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

  const tickDias     = [1, 8, 15, 22, 29]
  const nombreAliado = user?.nombre || 'aliado'
  const hora         = new Date().getHours()
  const saludo       = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="p-4 lg:p-8" style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto' }}>

        {/* ── Greeting ── */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: '0 0 4px', fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>
            {saludo} 👋
          </p>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
            ¡Hola, {nombreAliado}!{' '}
            <span style={{ color: '#6d28d9', fontWeight: 600 }}>¿qué vas a vender hoy?</span>
          </h1>
        </div>

        {/* ── Two-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Hero banner — cotizar CTA */}
            <div style={{
              background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 60%, #6366f1 100%)',
              borderRadius: 18,
              padding: '28px 32px',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 148,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              {/* Decorative 4-pointed star — large */}
              <svg
                style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', opacity: 0.2, pointerEvents: 'none' }}
                width="130" height="130" viewBox="0 0 200 200"
              >
                <path d="M100 0 C100 0 108 92 200 100 C200 100 108 108 100 200 C100 200 92 108 0 100 C0 100 92 92 100 0Z" fill="white" />
              </svg>
              {/* Small star */}
              <svg
                style={{ position: 'absolute', right: 56, top: 22, opacity: 0.15, pointerEvents: 'none' }}
                width="36" height="36" viewBox="0 0 200 200"
              >
                <path d="M100 0 C100 0 108 92 200 100 C200 100 108 108 100 200 C100 200 92 108 0 100 C0 100 92 92 100 0Z" fill="white" />
              </svg>

              <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#c7d2fe', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                Portal de aliados
              </p>
              <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.25, maxWidth: 340 }}>
                Cotiza un seguro en segundos y gana tu comisión
              </h2>
              <div>
                <button
                  onClick={() => navigate('/dashboard/cotizar')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    background: '#0f0e1a', border: 'none', borderRadius: 999, cursor: 'pointer',
                    padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 700,
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <Car size={14} />
                  Cotizar ahora
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', fontSize: 12,
                  }}>›</span>
                </button>
              </div>
            </div>

            {/* Stats — una card grande con 4 secciones diferenciadas */}
            <div style={{
              background: '#fff',
              borderRadius: 16,
              border: '1px solid #eeeeef',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>Resumen · {mesLabel} {anioLabel}</span>
              </div>
              {/* 4 columnas con divisores verticales */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {cards.map((c, idx) => {
                  const Icon = c.icon
                  return (
                    <div
                      key={c.label}
                      style={{
                        borderRight: idx < 3 ? '1px solid #f3f4f6' : 'none',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                      }}
                    >
                      <div style={{ padding: '12px 14px 8px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 8, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={13} color={c.iconColor} />
                          </div>
                          <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500, lineHeight: 1.3 }}>{c.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flexWrap: 'wrap', marginBottom: 2 }}>
                          <span style={{ fontSize: 17, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{c.value}</span>
                          {c.badge && (
                            <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 99, background: c.badgeBg, color: c.badgeColor }}>
                              {c.badge}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 10, color: c.showArrow ? (c.positive ? '#16a34a' : '#dc2626') : '#9ca3af', lineHeight: 1.4 }}>
                          {c.showArrow && <span style={{ marginRight: 1 }}>{c.positive ? '↗' : '↘'}</span>}
                          {c.sub}
                        </p>
                      </div>
                      <Sparkline data={c.spark} color={c.sparkColor} height={36} />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Pólizas enviadas a emitir — lista compacta */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eeeeef', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: polizas_proceso.length > 0 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Enviadas a emitir</span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: '#f3f4f6', color: '#6b7280' }}>
                    en vivo
                  </span>
                </div>
                <button
                  onClick={() => navigate('/dashboard/mis-polizas')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#7c3aed', fontWeight: 500 }}
                >
                  Ver todas →
                </button>
              </div>

              {polizas_proceso.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
                    Aún no has enviado ninguna cotización a emitir.
                  </p>
                </div>
              ) : (
                <div>
                  {polizas_proceso.map((p, i) => {
                    const cfg = {
                      en_proceso:    { dot: '#f59e0b', bg: '#fef3c7', color: '#92400e', label: 'En proceso'  },
                      aprobada:      { dot: '#10b981', bg: '#d1fae5', color: '#065f46', label: 'Aprobada'    },
                      no_convertida: { dot: '#ef4444', bg: '#fee2e2', color: '#991b1b', label: 'No aprobado' },
                    }[p.estado] || { dot: '#9ca3af', bg: '#f3f4f6', color: '#6b7280', label: p.estado }

                    return (
                      <div
                        key={p.id}
                        onClick={() => navigate('/dashboard/mis-polizas')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 16px',
                          borderBottom: i < polizas_proceso.length - 1 ? '1px solid #f9fafb' : 'none',
                          cursor: 'pointer', transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Status dot */}
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />

                        {/* Main info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                              {p.cliente_nombre || 'Sin nombre'}
                            </span>
                            {p.placa && (
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 5, background: '#f3f4f6', color: '#6b7280', flexShrink: 0 }}>
                                {p.placa}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>
                            {p.aseguradora || '—'} · {p.hace}
                            {p.valor_comision > 0 && <span style={{ color: '#16a34a', fontWeight: 600 }}> · +{fmt(p.valor_comision)}</span>}
                          </span>
                        </div>

                        {/* Status badge */}
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: cfg.bg, color: cfg.color, flexShrink: 0 }}>
                          {cfg.label}
                        </span>

                        {/* Arrow */}
                        <span style={{ color: '#d1d5db', fontSize: 16, flexShrink: 0 }}>›</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Actividad reciente */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eeeeef', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Actividad reciente</span>
                <button
                  onClick={() => navigate('/dashboard/cotizaciones')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#7c3aed', fontWeight: 500 }}
                >
                  Ver todas →
                </button>
              </div>

              {actividad.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🚘</div>
                  <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                    Aquí verás tu actividad reciente
                  </p>
                  <p style={{ margin: '0 0 16px', fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
                    Empieza creando tu primera cotización<br />en menos de 2 minutos.
                  </p>
                  <button onClick={() => navigate('/dashboard/cotizar')}
                    style={{ background: '#2D2A7A', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
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

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'start' }}>

            {/* Tu rendimiento — card gris (mismo fondo que la página) */}
            <div style={{
              background: '#eeeeef',
              borderRadius: 18,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Tu rendimiento</span>
                <span style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'rgba(0,0,0,0.07)', color: '#6b7280' }}>
                  Este mes
                </span>
              </div>

              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Comisiones generadas</p>
                <span style={{ fontSize: 30, fontWeight: 800, color: '#111827', letterSpacing: '-1px', lineHeight: 1 }}>
                  {fmt(rendimiento.comisiones_mes)}
                </span>
                <p style={{ margin: '6px 0 0', fontSize: 11, color: '#6d28d9', fontWeight: 500 }}>
                  ¡Sigue así, {nombreAliado}! 🔥
                </p>
              </div>

              <div style={{ background: '#fff', borderRadius: 12, padding: '12px 12px 8px', marginBottom: 0 }}>
                <BarChart data={rendimiento.grafica} color="#4f46e5" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  {tickDias.map(dia => (
                    <span key={dia} style={{ fontSize: 10, color: '#9ca3af' }}>{dia}</span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate('/dashboard/pagos')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#4f46e5', fontWeight: 600, padding: '12px 0 0', textAlign: 'left' }}
              >
                Ver reporte completo →
              </button>
            </div>

            {/* Anto — card propia */}
            <div style={{
              background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 100%)',
              border: '1.5px solid #ddd6fe',
              borderRadius: 18,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#2D2A7A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={18} color="#fff" />
                </div>
                <div>
                  <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 800, color: '#1e1b6e' }}>✨ Anto, tu IA</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#6d28d9', lineHeight: 1.55 }}>
                    Explica coberturas, compara aseguradoras y responde las preguntas de tus clientes en segundos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => document.querySelector('[data-anto-pill]')?.click()}
                style={{
                  background: '#2D2A7A', color: '#fff', border: 'none', borderRadius: 10,
                  padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%',
                  transition: 'opacity 0.15s',
                }}
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
  )
}
