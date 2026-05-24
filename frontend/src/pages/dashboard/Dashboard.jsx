import { useState, useEffect, useCallback } from 'react'
import { DollarSign, FileText, Shield, TrendingUp, Sparkles, Car, ChevronLeft, ChevronRight, MoreHorizontal, Plus } from 'lucide-react'
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
  enviada:       { bg: '#dcfce7', color: '#16a34a', label: 'Enviada'          },
  cerrada:       { bg: '#f3f4f6', color: '#6b7280', label: 'Cerrada'          },
  lead:          { bg: '#dcfce7', color: '#16a34a', label: 'Enviada'          },
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
  en_proceso:    { grad: 'linear-gradient(135deg,#fbbf24,#f59e0b)', dot: '#f59e0b', bg: '#fef3c7', color: '#92400e', label: 'En proceso'  },
  aprobada:      { grad: 'linear-gradient(135deg,#34d399,#10b981)', dot: '#10b981', bg: '#d1fae5', color: '#065f46', label: 'Aprobada'    },
  no_convertida: { grad: 'linear-gradient(135deg,#f87171,#ef4444)', dot: '#ef4444', bg: '#fee2e2', color: '#991b1b', label: 'No aprobado' },
}
function getPcfg(estado) {
  return POLIZA_CFG[estado] || { grad: 'linear-gradient(135deg,#9ca3af,#6b7280)', dot: '#9ca3af', bg: '#f3f4f6', color: '#374151', label: estado }
}

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

// ─── Donut ring ───────────────────────────────────────────────────────────────
function DonutRing({ pct: p = 0, size = 96, stroke = 9, color = '#4f46e5' }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.min(p, 100) / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
      <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', top: -6, right: -6,
        background: color, color: '#fff', fontSize: 9, fontWeight: 800,
        borderRadius: 99, padding: '2px 6px', lineHeight: 1.4,
      }}>
        {p}%
      </div>
    </div>
  )
}

// ─── Period bar chart (3 columns: 1-10, 11-20, 21-30) ────────────────────────
function PeriodBarChart({ data = [] }) {
  const inc = data.map((d, i) => ({
    dia: d.dia,
    monto: i === 0 ? d.monto : d.monto - data[i - 1].monto,
  }))
  const sums = [
    inc.filter(d => d.dia <= 10).reduce((s, d) => s + d.monto, 0),
    inc.filter(d => d.dia > 10 && d.dia <= 20).reduce((s, d) => s + d.monto, 0),
    inc.filter(d => d.dia > 20).reduce((s, d) => s + d.monto, 0),
  ]
  const max = Math.max(...sums, 1)
  const labels = ['1-10', '11-20', '21-31']
  const yTicks = [0, Math.round(max * 0.5), max].reverse()

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {/* Y axis */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 20, height: 100 }}>
        {yTicks.map((v, i) => (
          <span key={i} style={{ fontSize: 9, color: '#9ca3af', lineHeight: 1 }}>
            {v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}K` : v}
          </span>
        ))}
      </div>
      {/* Bars */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 80 }}>
          {sums.map((val, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              {/* secondary bar (lighter) */}
              <div style={{ width: '40%', height: `${Math.max((val / max) * 60, val > 0 ? 4 : 2)}%`, background: '#c7d2fe', borderRadius: '3px 3px 0 0' }} />
              {/* main bar */}
              <div style={{
                width: '40%',
                height: `${Math.max((val / max) * 100, val > 0 ? 8 : 3)}%`,
                background: '#4f46e5',
                borderRadius: '3px 3px 0 0',
              }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          {labels.map((l, i) => (
            <span key={i} style={{ flex: 1, fontSize: 9, color: '#9ca3af', textAlign: 'center' }}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  const p = { background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'pulse 1.5s infinite', borderRadius: 8 }
  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ ...p, height: 150, borderRadius: 18 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ ...p, height: 72, borderRadius: 14 }} />)}
          </div>
          <div style={{ ...p, height: 240, borderRadius: 16 }} />
          <div style={{ ...p, height: 200, borderRadius: 16 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ ...p, height: 280, borderRadius: 18 }} />
          <div style={{ ...p, height: 220, borderRadius: 18 }} />
        </div>
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
  const [polizaPage, setPolizaPage] = useState(0)

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
  const nowDate     = new Date()
  const mesLabel    = MESES[nowDate.getMonth()]
  const mesCorto    = MESES_CORTO[nowDate.getMonth()]
  const anioLabel   = nowDate.getFullYear()
  const nombreAliado = user?.nombre || 'aliado'
  const hora        = new Date().getHours()
  const saludo      = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'
  const metaPct     = Math.min(100, Math.round((rendimiento.comisiones_mes / (rendimiento.meta_mes || 5000000)) * 100))

  const pills = [
    { icon: DollarSign, iconBg: '#dcfce7', iconColor: '#16a34a', label: 'Próximo pago',         value: fmt(stats.proximo_pago.monto ?? 0),       sub: `1 de ${MESES[stats.proximo_pago.mes - 1]}`, positive: null },
    { icon: FileText,   iconBg: '#dbeafe', iconColor: '#2563eb', label: 'Cotizaciones',          value: String(stats.cotizaciones_mes.total),      sub: `${pct(stats.cotizaciones_mes.variacion)} vs anterior`, positive: stats.cotizaciones_mes.variacion >= 0 },
    { icon: Shield,     iconBg: '#ede9fe', iconColor: '#7c3aed', label: 'Pólizas aprobadas',     value: String(stats.polizas_mes.total),           sub: `${pct(stats.polizas_mes.variacion)} vs anterior`, positive: stats.polizas_mes.variacion >= 0 },
    { icon: TrendingUp, iconBg: '#fff7ed', iconColor: '#ea580c', label: 'Total ganado histórico', value: fmt(stats.total_ganado.monto),             sub: `${pct(stats.total_ganado.variacion)} vs anterior`, positive: stats.total_ganado.variacion >= 0 },
  ]

  const PAGE_SIZE = 3
  const totalPages = Math.ceil(polizas_proceso.length / PAGE_SIZE)
  const visiblePolizas = polizas_proceso.slice(polizaPage * PAGE_SIZE, polizaPage * PAGE_SIZE + PAGE_SIZE)

  const antoFeatures = [
    { emoji: '🔍', title: 'Comparar aseguradoras',      sub: 'Copiloto IA' },
    { emoji: '📋', title: 'Explicar coberturas',         sub: 'Copiloto IA' },
    { emoji: '💬', title: 'Responder dudas del cliente', sub: 'Copiloto IA' },
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
              <svg style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', opacity: 0.2, pointerEvents: 'none' }} width="130" height="130" viewBox="0 0 200 200">
                <path d="M100 0 C100 0 108 92 200 100 C200 100 108 108 100 200 C100 200 92 108 0 100 C0 100 92 92 100 0Z" fill="white" />
              </svg>
              <svg style={{ position: 'absolute', right: 58, top: 22, opacity: 0.12, pointerEvents: 'none' }} width="36" height="36" viewBox="0 0 200 200">
                <path d="M100 0 C100 0 108 92 200 100 C200 100 108 108 100 200 C100 200 92 108 0 100 C0 100 92 92 100 0Z" fill="white" />
              </svg>
              <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: '#c7d2fe', letterSpacing: 1.2, textTransform: 'uppercase' }}>Portal de aliados</p>
              <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.25, maxWidth: 340 }}>
                Cotiza un seguro en segundos y gana tu comisión
              </h2>
              <button
                onClick={() => navigate('/dashboard/cotizar')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#0f0e1a', border: 'none', borderRadius: 999, cursor: 'pointer', padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 700, transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <Car size={14} />
                Cotizar ahora
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', fontSize: 14 }}>›</span>
              </button>
            </div>

            {/* 2. Stats pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {pills.map((c, i) => {
                const Icon = c.icon
                return (
                  <div key={i} style={{
                    background: '#fff', borderRadius: 14, border: '1px solid #eeeeef',
                    padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color={c.iconColor} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: '0 0 1px', fontSize: 9.5, color: '#9ca3af', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.label}</p>
                      <p style={{ margin: '0 0 1px', fontSize: 14, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.value}</p>
                      <p style={{ margin: 0, fontSize: 9.5, color: c.positive === null ? '#9ca3af' : c.positive ? '#16a34a' : '#dc2626', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.positive !== null && <span style={{ marginRight: 1 }}>{c.positive ? '↗' : '↘'}</span>}
                        {c.sub}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 3. Enviadas a emitir — "Continue Watching" style */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Enviadas a emitir</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setPolizaPage(p => Math.max(0, p - 1))}
                    disabled={polizaPage === 0}
                    style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: polizaPage === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: polizaPage === 0 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={14} color="#6b7280" />
                  </button>
                  <button
                    onClick={() => setPolizaPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={polizaPage >= totalPages - 1 || polizas_proceso.length === 0}
                    style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#4f46e5', cursor: (polizaPage >= totalPages - 1 || polizas_proceso.length === 0) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (polizaPage >= totalPages - 1 || polizas_proceso.length === 0) ? 0.4 : 1 }}
                  >
                    <ChevronRight size={14} color="#fff" />
                  </button>
                </div>
              </div>

              {polizas_proceso.length === 0 ? (
                <div style={{ background: '#f9fafb', borderRadius: 14, border: '1px dashed #e5e7eb', padding: '28px 20px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>Aún no has enviado ninguna cotización a emitir.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  {visiblePolizas.map((p) => {
                    const cfg = getPcfg(p.estado)
                    return (
                      <div
                        key={p.id}
                        onClick={() => navigate('/dashboard/mis-polizas')}
                        style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #eeeeef', cursor: 'pointer', background: '#fff', transition: 'box-shadow 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                      >
                        {/* Colored top (like image thumbnail) */}
                        <div style={{ height: 110, background: cfg.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                          <span style={{ fontSize: 36 }}>🚗</span>
                          <div style={{ position: 'absolute', top: 10, left: 10 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(0,0,0,0.25)', color: '#fff', padding: '2px 7px', borderRadius: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                        {/* Content */}
                        <div style={{ padding: '12px' }}>
                          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.cliente_nombre || 'Sin nombre'}
                          </p>
                          <p style={{ margin: '0 0 10px', fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.placa || '—'} · {p.aseguradora || '—'}
                          </p>
                          {/* Footer */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #f3f4f6', paddingTop: 10 }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: cfg.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 10 }}>🏢</span>
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.aseguradora || '—'}
                              </p>
                              <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>
                                {p.valor_comision > 0 ? `+${fmt(p.valor_comision)}` : p.hace}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 4. Actividad reciente — "Your Lesson" table style */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Actividad reciente</span>
                <button onClick={() => navigate('/dashboard/cotizaciones')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#7c3aed', fontWeight: 500 }}>
                  Ver todas →
                </button>
              </div>

              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 90px 90px 90px', gap: 8, padding: '6px 12px', marginBottom: 4 }}>
                {['CLIENTE', 'TIPO', 'DETALLE', 'ESTADO'].map(h => (
                  <span key={h} style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, letterSpacing: 0.5 }}>{h}</span>
                ))}
              </div>

              {actividad.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #eeeeef', padding: '28px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🚘</div>
                  <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#374151' }}>Aquí verás tu actividad</p>
                  <button onClick={() => navigate('/dashboard/cotizar')} style={{ background: '#2D2A7A', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Nueva cotización →
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {actividad.map((a, i) => {
                    const badge  = getBadge(a.estado, a.tipo)
                    const nombre = a.cliente_nombre || 'Sin nombre'
                    const detalle = (a.tipo === 'cotizacion')
                      ? (a.aseguradora && a.aseguradora !== '—' ? a.aseguradora : '—')
                      : (a.aseguradora || '—')
                    const tipoLabel = a.tipo === 'cotizacion' ? 'Cotización' : 'Póliza'
                    const tipoBg    = a.tipo === 'cotizacion' ? '#dbeafe' : '#ede9fe'
                    const tipoColor = a.tipo === 'cotizacion' ? '#1d4ed8' : '#7c3aed'

                    return (
                      <div
                        key={`${a.tipo}-${a.id}-${i}`}
                        style={{ display: 'grid', gridTemplateColumns: '1.4fr 90px 90px 90px', gap: 8, alignItems: 'center', padding: '10px 12px', background: '#fff', borderRadius: 12, border: '1px solid #f3f4f6' }}
                      >
                        {/* Cliente */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: a.estado === 'enviada' ? '#dcfce7' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={13} color={a.estado === 'enviada' ? '#16a34a' : '#2563eb'} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</p>
                            <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>{a.hace}</p>
                          </div>
                        </div>
                        {/* Tipo */}
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 5, background: tipoBg, color: tipoColor, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
                          {tipoLabel.toUpperCase()}
                        </span>
                        {/* Detalle */}
                        <span style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{detalle}</span>
                        {/* Estado + arrow */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 9.5, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>
                            {badge.label}
                          </span>
                          <button style={{ width: 22, height: 22, borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ChevronRight size={12} color="#6b7280" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ═══ RIGHT COLUMN ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* 5. Tu rendimiento — Statistic style */}
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #eeeeef', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Tu rendimiento</span>
                <button onClick={() => navigate('/dashboard/pagos')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 2 }}>
                  <MoreHorizontal size={16} />
                </button>
              </div>

              {/* Donut + greeting */}
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <DonutRing pct={metaPct} size={88} stroke={8} color="#4f46e5" />
                <p style={{ margin: '12px 0 2px', fontSize: 15, fontWeight: 700, color: '#111827' }}>
                  {saludo}, {nombreAliado}! 🔥
                </p>
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>
                  {metaPct >= 100 ? '¡Meta del mes superada!' : 'Sigue así para alcanzar tu meta'}
                </p>
              </div>

              {/* Comisiones */}
              <div style={{ background: '#f9f9fb', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ margin: '0 0 2px', fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>Comisiones generadas · {mesCorto}</p>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>{fmt(rendimiento.comisiones_mes)}</span>
              </div>

              {/* Period bar chart */}
              <PeriodBarChart data={rendimiento.grafica} />
            </div>

            {/* 6. Anto — "Your mentor" style */}
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #eeeeef', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Tu copiloto</span>
                <button
                  onClick={() => document.querySelector('[data-anto-pill]')?.click()}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Plus size={14} color="#6b7280" />
                </button>
              </div>

              {antoFeatures.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < antoFeatures.length - 1 ? 14 : 0 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 16 }}>{f.emoji}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 1px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{f.title}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{f.sub}</p>
                  </div>
                  <button
                    onClick={() => document.querySelector('[data-anto-pill]')?.click()}
                    style={{ fontSize: 11, fontWeight: 600, color: '#4f46e5', background: '#f5f3ff', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <Sparkles size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    Abrir
                  </button>
                </div>
              ))}

              <div style={{ borderTop: '1px solid #f3f4f6', marginTop: 16, paddingTop: 14 }}>
                <button
                  onClick={() => document.querySelector('[data-anto-pill]')?.click()}
                  style={{ width: '100%', background: '#f5f3ff', color: '#4f46e5', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#ede9fe'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f5f3ff'}
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
