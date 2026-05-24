import { useState, useEffect, useCallback } from 'react'
import { DollarSign, FileText, Shield, TrendingUp, Sparkles, Car, ChevronRight, MoreHorizontal } from 'lucide-react'
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
  en_proceso:    { cardBg: '#fffbeb', border: '#fde68a', accent: '#f59e0b', color: '#92400e', label: 'En proceso'  },
  aprobada:      { cardBg: '#f0fdf4', border: '#bbf7d0', accent: '#10b981', color: '#065f46', label: 'Aprobada'    },
  no_convertida: { cardBg: '#fff1f2', border: '#fecdd3', accent: '#f43f5e', color: '#991b1b', label: 'No aprobado' },
}
function getPcfg(estado) {
  return POLIZA_CFG[estado] || { cardBg: '#f9fafb', border: '#e5e7eb', accent: '#9ca3af', color: '#374151', label: estado }
}

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const ANTO_ACCIONES = [
  { label: 'Preguntar por coberturas',     sub: 'Qué cubre la póliza del cliente' },
  { label: 'Comparar aseguradoras',        sub: 'Diferencias entre opciones'      },
  { label: 'Explicar exclusiones',         sub: 'Qué NO cubre la póliza'          },
  { label: 'Responder dudas del cliente',  sub: 'Respuestas rápidas y claras'     },
]

// ─── Sparkline ───────────────────────────────────────────────────────────────
function Sparkline({ data = [], color = '#2D2A7A', height = 40 }) {
  if (data.length < 2) {
    return (
      <svg viewBox="0 0 100 40" width="100%" height={height} preserveAspectRatio="none">
        <line x1="0" y1="20" x2="100" y2="20" stroke={color} strokeWidth="1.5" strokeOpacity="0.25" />
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
  const gradId = `sg-${color.replace('#', '')}-${height}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Bar chart (daily cumulative) ────────────────────────────────────────────
function BarChart({ data = [], color = '#4f46e5' }) {
  if (!data.length) {
    return (
      <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>Sin datos aún</span>
      </div>
    )
  }
  const max = Math.max(...data.map(d => d.monto), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 90, width: '100%' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div
            title={`Día ${d.dia}: ${fmt(d.monto)}`}
            style={{
              width: '100%',
              height: `${Math.max((d.monto / max) * 100, d.monto > 0 ? 4 : 2)}%`,
              background: color,
              opacity: d.monto > 0 ? 0.6 + (d.monto / max) * 0.4 : 0.1,
              borderRadius: '2px 2px 0 0',
            }}
          />
        </div>
      ))}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  const p = { background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'pulse 1.5s infinite', borderRadius: 10 }
  return (
    <div style={{ padding: '16px 20px' }}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ ...p, height: 130, borderRadius: 18 }} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[1,2,3,4].map(i => <div key={i} style={{ ...p, height: 80 }} />)}
          </div>
          <div style={{ ...p, height: 200, borderRadius: 16 }} />
          <div style={{ ...p, height: 200, borderRadius: 16 }} />
        </div>
        <div style={{ ...p, height: 480, borderRadius: 18 }} />
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
  const mesCorto     = MESES_CORTO[nowDate.getMonth()]
  const anioLabel    = nowDate.getFullYear()
  const nombreAliado = user?.nombre || 'aliado'
  const apellido     = user?.apellido || ''
  const initials     = (nombreAliado[0] || '') + (apellido[0] || nombreAliado[1] || '')
  const hora         = new Date().getHours()
  const saludo       = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'
  const tickDias     = [1, 8, 15, 22, 29]

  const statCards = [
    {
      icon: DollarSign, iconBg: '#dcfce7', iconColor: '#16a34a',
      label: 'Próximo pago',
      value: fmt(stats.proximo_pago.monto ?? 0),
      sub: stats.proximo_pago.mes ? `1 de ${MESES[stats.proximo_pago.mes - 1]}` : '—',
      positive: null,
      spark: sparklines.ganancias, sparkColor: '#16a34a',
    },
    {
      icon: FileText, iconBg: '#dbeafe', iconColor: '#2563eb',
      label: `Cotizaciones · ${mesCorto}`,
      value: String(stats.cotizaciones_mes.total),
      sub: `${pct(stats.cotizaciones_mes.variacion)} vs. anterior`,
      positive: stats.cotizaciones_mes.variacion >= 0,
      spark: sparklines.cotizaciones, sparkColor: '#2563eb',
    },
    {
      icon: Shield, iconBg: '#ede9fe', iconColor: '#7c3aed',
      label: `Pólizas aprobadas · ${mesCorto}`,
      value: String(stats.polizas_mes.total),
      sub: `${pct(stats.polizas_mes.variacion)} vs. anterior`,
      positive: stats.polizas_mes.variacion >= 0,
      spark: sparklines.polizas, sparkColor: '#7c3aed',
    },
    {
      icon: TrendingUp, iconBg: '#fff7ed', iconColor: '#ea580c',
      label: 'Total ganado histórico',
      value: fmt(stats.total_ganado.monto),
      sub: `${pct(stats.total_ganado.variacion)} vs. anterior`,
      positive: stats.total_ganado.variacion >= 0,
      spark: sparklines.ganancias, sparkColor: '#ea580c',
    },
  ]

  return (
    <div style={{ padding: '16px 20px', height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 lg:gap-5" style={{ alignItems: 'start' }}>

          {/* ═══ LEFT COLUMN ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* 1. Hero — white card with greeting + avatar */}
            <div style={{
              background: '#fff',
              borderRadius: 18, padding: '24px 28px',
              border: '1px solid #eeeeef',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Portal de aliados
                </p>
                <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: '#111827', lineHeight: 1.25 }}>
                  {saludo}, {nombreAliado}! 👋
                </h2>
                <p style={{ margin: '0 0 18px', fontSize: 13, color: '#6b7280' }}>
                  ¿Qué vas a vender hoy?
                </p>
                <button
                  onClick={() => navigate('/dashboard/cotizar')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: 'fit-content', background: '#2D2A7A', border: 'none', borderRadius: 999, cursor: 'pointer', padding: '9px 18px', color: '#fff', fontSize: 13, fontWeight: 700, transition: 'opacity 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <Car size={14} />
                  Cotizar ahora
                </button>
              </div>
              {/* Avatar */}
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#2D2A7A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#fff', textTransform: 'uppercase', lineHeight: 1 }}>
                  {(initials || nombreAliado[0] || 'A').toUpperCase()}
                </span>
              </div>
            </div>

            {/* 2. Stats cards — título arriba, valor abajo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
              {statCards.map((c, i) => {
                const Icon = c.icon
                return (
                  <div key={i} style={{
                    background: '#fff', borderRadius: 14, border: '1px solid #eeeeef',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                  }}>
                    <div style={{ padding: '12px 12px 8px', flex: 1 }}>
                      {/* Icono + título */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={13} color={c.iconColor} />
                        </div>
                        <span style={{ fontSize: 9.5, color: '#9ca3af', fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
                        <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 0, display: 'flex', flexShrink: 0 }}>
                          <MoreHorizontal size={12} />
                        </button>
                      </div>
                      {/* Valor (contenido principal) */}
                      <p style={{ margin: '0 0 3px', fontSize: 17, fontWeight: 800, color: '#111827', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.value}</p>
                      {/* Sub */}
                      <p style={{ margin: 0, fontSize: 10, color: c.positive === null ? '#9ca3af' : c.positive ? '#16a34a' : '#dc2626' }}>
                        {c.positive !== null && <span style={{ marginRight: 2 }}>{c.positive ? '↗' : '↘'}</span>}
                        {c.sub}
                      </p>
                    </div>
                    {/* Sparkline */}
                    <div style={{ height: 40, overflow: 'hidden' }}>
                      <Sparkline data={c.spark} color={c.sparkColor} height={40} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 3. Enviadas a emitir — mini-cards por estado, sin emojis */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eeeeef', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Enviadas a emitir</span>
                <button onClick={() => navigate('/dashboard/mis-polizas')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#7c3aed', fontWeight: 500 }}>
                  Ver todas →
                </button>
              </div>

              {polizas_proceso.length === 0 ? (
                <div style={{ padding: '28px 18px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>Aún no has enviado ninguna cotización a emitir.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" style={{ padding: 14 }}>
                  {polizas_proceso.map((p) => {
                    const cfg = getPcfg(p.estado)
                    return (
                      <div
                        key={p.id}
                        onClick={() => navigate('/dashboard/mis-polizas')}
                        style={{
                          background: cfg.cardBg,
                          borderRadius: 12,
                          border: `1.5px solid ${cfg.border}`,
                          padding: '12px 14px',
                          cursor: 'pointer',
                          transition: 'transform 0.12s, box-shadow 0.12s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                      >
                        {/* Estado label */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 9.5, fontWeight: 800, color: cfg.color, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                            {cfg.label}
                          </span>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.accent, flexShrink: 0 }} />
                        </div>
                        {/* Cliente */}
                        <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.cliente_nombre || 'Sin nombre'}
                        </p>
                        {/* Placa + aseguradora */}
                        <p style={{ margin: '0 0 8px', fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.placa || '—'} · {p.aseguradora || '—'}
                        </p>
                        {/* Footer */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${cfg.border}`, paddingTop: 8 }}>
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>{p.hace}</span>
                          {p.valor_comision > 0
                            ? <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>+{fmt(p.valor_comision)}</span>
                            : <ChevronRight size={13} color={cfg.color} />
                          }
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 4. Actividad reciente */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eeeeef', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Actividad reciente</span>
                <button onClick={() => navigate('/dashboard/cotizaciones')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#7c3aed', fontWeight: 500 }}>
                  Ver todas →
                </button>
              </div>

              {actividad.length === 0 ? (
                <div style={{ padding: '36px 18px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#374151' }}>Aquí verás tu actividad reciente</p>
                  <p style={{ margin: '0 0 14px', fontSize: 12, color: '#9ca3af' }}>Empieza creando tu primera cotización.</p>
                  <button onClick={() => navigate('/dashboard/cotizar')} style={{ background: '#2D2A7A', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Nueva cotización →
                  </button>
                </div>
              ) : (
                <div>
                  {actividad.map((a, i) => {
                    const badge  = getBadge(a.estado, a.tipo)
                    const nombre = a.cliente_nombre || 'Sin nombre'
                    const sub    = a.tipo === 'cotizacion'
                      ? (a.aseguradora && a.aseguradora !== '—' ? `Placa: ${a.aseguradora}` : 'Sin placa')
                      : (a.aseguradora || '—')
                    return (
                      <div
                        key={`${a.tipo}-${a.id}-${i}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: i < actividad.length - 1 ? '1px solid #f9fafb' : 'none' }}
                      >
                        <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: a.estado === 'enviada' ? '#dcfce7' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={15} color={a.estado === 'enviada' ? '#16a34a' : '#2563eb'} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nombre}</div>
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

          {/* ═══ RIGHT COLUMN ═══ */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e5e7eb', padding: 12, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

            {/* 5. Tu rendimiento */}
            <div style={{ background: '#eeeeef', borderRadius: 16, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Tu rendimiento</span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: '#fff', color: '#6b7280' }}>
                  {mesCorto} {anioLabel}
                </span>
              </div>

              {/* Comisiones */}
              <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
                <p style={{ margin: '0 0 2px', fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>Comisiones generadas · {mesCorto}</p>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>{fmt(rendimiento.comisiones_mes)}</span>
              </div>

              {/* Bar chart */}
              <BarChart data={rendimiento.grafica} color="#4f46e5" />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {tickDias.map(dia => <span key={dia} style={{ fontSize: 9, color: '#9ca3af' }}>{dia}</span>)}
              </div>

              <button
                onClick={() => navigate('/dashboard/pagos')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#4f46e5', fontWeight: 600, padding: '8px 0 0', display: 'block' }}
              >
                Ver reporte completo →
              </button>

              {/* Anto quick actions */}
              <div style={{ marginTop: 14, borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
                <p style={{ margin: '0 0 8px', fontSize: 9.5, fontWeight: 700, color: '#9ca3af', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                  Acciones con Anto IA
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ANTO_ACCIONES.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => document.querySelector('[data-anto-pill]')?.click()}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 9,
                        padding: '8px 10px', cursor: 'pointer', textAlign: 'left',
                        transition: 'border-color 0.13s, background 0.13s',
                        gap: 8,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#c4b5fd'; e.currentTarget.style.background = '#faf5ff' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fff' }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: '0 0 1px', fontSize: 11.5, fontWeight: 600, color: '#111827' }}>{a.label}</p>
                        <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>{a.sub}</p>
                      </div>
                      <Sparkles size={12} color="#7c3aed" style={{ flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 6. Tu copiloto — Anto banner */}
            <div style={{ background: '#eeeeef', borderRadius: 16, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#2D2A7A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={18} color="#fff" />
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 800, color: '#1e1b6e' }}>
                    ✨ Vende seguros aunque no seas experto
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: '#6d28d9', lineHeight: 1.5 }}>
                    Anto explica coberturas, compara aseguradoras y responde las preguntas de tus clientes en segundos.
                  </p>
                </div>
              </div>
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
  )
}
