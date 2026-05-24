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

            {/* Resumen label */}
            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
              Resumen · {mesLabel} {anioLabel}
            </p>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
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
                    <div style={{ padding: '16px 16px 10px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={16} color={c.iconColor} />
                        </div>
                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, lineHeight: 1.3 }}>{c.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{c.value}</span>
                        {c.badge && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: c.badgeBg, color: c.badgeColor }}>
                            {c.badge}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: 11, color: c.showArrow ? (c.positive ? '#16a34a' : '#dc2626') : '#9ca3af' }}>
                        {c.showArrow && <span style={{ marginRight: 2 }}>{c.positive ? '↗' : '↘'}</span>}
                        {c.sub}
                      </p>
                    </div>
                    <div style={{ marginTop: 'auto' }}>
                      <Sparkline data={c.spark} color={c.sparkColor} height={44} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pólizas enviadas a emitir */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Enviadas a emitir</span>
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#9ca3af' }}>— estado en vivo</span>
                </div>
                <button
                  onClick={() => navigate('/dashboard/mis-polizas')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#7c3aed', fontWeight: 500 }}
                >
                  Ver todas →
                </button>
              </div>

              {polizas_proceso.length === 0 ? (
                <div style={{
                  background: '#f9fafb', borderRadius: 14, border: '1px dashed #e5e7eb',
                  padding: '22px 20px', textAlign: 'center',
                }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
                    Aún no has enviado ninguna cotización a emitir.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }} className="hide-scrollbar">
                  {polizas_proceso.map((p) => {
                    const cfg = {
                      en_proceso:    { bar: '#f59e0b', bg: '#fef3c7', color: '#92400e', label: 'En proceso'   },
                      aprobada:      { bar: '#10b981', bg: '#d1fae5', color: '#065f46', label: 'Aprobada'     },
                      no_convertida: { bar: '#ef4444', bg: '#fee2e2', color: '#991b1b', label: 'No aprobado'  },
                    }[p.estado] || { bar: '#9ca3af', bg: '#f3f4f6', color: '#374151', label: p.estado }

                    return (
                      <div
                        key={p.id}
                        style={{
                          minWidth: 200, maxWidth: 200, flexShrink: 0,
                          background: '#fff', borderRadius: 14,
                          border: '1px solid #eeeeef',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Status colour bar */}
                        <div style={{ height: 4, background: cfg.bar }} />

                        <div style={{ padding: '12px 14px 14px' }}>
                          {/* Status badge */}
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontSize: 10, fontWeight: 700,
                            padding: '3px 8px', borderRadius: 99,
                            background: cfg.bg, color: cfg.color, marginBottom: 10,
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.bar, flexShrink: 0 }} />
                            {cfg.label}
                          </span>

                          {/* Client */}
                          <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.cliente_nombre || 'Sin nombre'}
                          </p>

                          {/* Plate · aseguradora */}
                          <p style={{ margin: '0 0 10px', fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.placa || '—'} · {p.aseguradora || '—'}
                          </p>

                          {/* Commission */}
                          {p.valor_comision > 0
                            ? <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 800, color: '#16a34a' }}>+{fmt(p.valor_comision)}</p>
                            : <p style={{ margin: '0 0 3px', fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>Pendiente de aprobación</p>
                          }

                          {/* Time */}
                          <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>{p.hace}</p>
                        </div>
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

          {/* ── RIGHT COLUMN — una sola card ── */}
          <div style={{
            background: '#fff',
            borderRadius: 18,
            border: '1px solid #eeeeef',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            alignSelf: 'start',
          }}>

            {/* Tu rendimiento */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Tu rendimiento</span>
                <span style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#f3f4f6', color: '#6b7280' }}>
                  Este mes
                </span>
              </div>

              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>Comisiones generadas</p>
                <span style={{ fontSize: 30, fontWeight: 800, color: '#111827', letterSpacing: '-1px', lineHeight: 1 }}>
                  {fmt(rendimiento.comisiones_mes)}
                </span>
                <p style={{ margin: '6px 0 0', fontSize: 11, color: '#6d28d9', fontWeight: 500 }}>
                  ¡Sigue así, {nombreAliado}! 🔥
                </p>
              </div>

              <div style={{ marginBottom: 4 }}>
                <BarChart data={rendimiento.grafica} color="#4f46e5" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                {tickDias.map(dia => (
                  <span key={dia} style={{ fontSize: 10, color: '#9ca3af' }}>{dia}</span>
                ))}
              </div>

              <button
                onClick={() => navigate('/dashboard/pagos')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#4f46e5', fontWeight: 600, padding: 0, textAlign: 'left' }}
              >
                Ver reporte completo →
              </button>
            </div>

            {/* Divisor */}
            <div style={{ borderTop: '1px solid #f3f4f6', margin: '0 -20px 20px' }} />

            {/* Anto */}
            <div style={{
              background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 100%)',
              border: '1.5px solid #ddd6fe',
              borderRadius: 14,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
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
