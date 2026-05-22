import { useState, useEffect, useCallback } from 'react'
import { DollarSign, FileText, Shield, TrendingUp, Sparkles, Car } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSSE } from '../../context/SSEContext'

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
  // Cotizaciones
  activa:        { bg: '#dbeafe', color: '#1d4ed8', label: 'Cotizada'          },
  enviada:       { bg: '#dcfce7', color: '#16a34a', label: 'Enviada a emitir'  },
  cerrada:       { bg: '#f3f4f6', color: '#6b7280', label: 'Cerrada'           },
  // Leads
  lead:          { bg: '#dcfce7', color: '#16a34a', label: 'Enviada a emitir'  },
  // Pólizas admin
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
  const { subscribe }      = useSSE()
  const navigate           = useNavigate()
  const [data, setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch reutilizable — silent=true no muestra skeleton al refrescar en vivo
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

  // ── Actualizaciones en vivo: cuando cambia estado de una póliza ───────────
  useEffect(() => {
    return subscribe('poliza_update', () => {
      // Refetch silencioso — stats, actividad y gráficas se actualizan sin parpadeo
      fetchDashboard(true)
    })
  }, [subscribe, fetchDashboard])

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

  // X-axis tick labels for bar chart
  const tickDias = [1, 8, 15, 22, 29]

  const nombreAliado = user?.nombre || 'aliado'
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="p-4 lg:p-8" style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto' }}>

      {/* ── Hero ── */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ margin:'0 0 4px', fontSize:13, color:'#9ca3af', fontWeight:500 }}>
          {saludo} 👋
        </p>
        <h1 style={{ margin:'0 0 16px', fontSize:26, fontWeight:800, color:'#111827', lineHeight:1.2 }}>
          ¡Hola, {nombreAliado}!{' '}
          <span style={{ color:'#6d28d9', fontWeight:600 }}>¿qué vas a vender hoy?</span>
        </h1>

        {/* Acción principal */}
        <button
          onClick={() => navigate('/dashboard/cotizar')}
          style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'#2D2A7A', border:'none', borderRadius:10, cursor:'pointer',
            padding:'10px 20px', color:'#fff', fontSize:13, fontWeight:700,
            transition:'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Car size={15} />
          Nueva cotización
        </button>
      </div>

      {/* ── Card Anto — el copiloto IA ── */}
      <div style={{
        background:'linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%)',
        border:'1.5px solid #ddd6fe', borderRadius:18, padding:'20px 22px', marginBottom:20,
        display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16,
      }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:14, flex:1, minWidth:220 }}>
          <div style={{ width:44, height:44, borderRadius:14, background:'#2D2A7A',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <p style={{ margin:'0 0 3px', fontSize:15, fontWeight:800, color:'#1e1b6e' }}>
              ✨ Vende seguros aunque no seas experto
            </p>
            <p style={{ margin:0, fontSize:13, color:'#6d28d9', lineHeight:1.55 }}>
              Anto explica coberturas, compara aseguradoras y responde las preguntas de tus clientes en segundos.
            </p>
          </div>
        </div>
        <button
          onClick={() => document.querySelector('[data-anto-pill]')?.click()}
          style={{ background:'#2D2A7A', color:'#fff', border:'none', borderRadius:10,
            padding:'9px 18px', fontSize:13, fontWeight:700, cursor:'pointer', flexShrink:0 }}>
          Preguntarle a Anto
        </button>
      </div>

      <p style={{ margin: '0 0 16px', fontSize: 12, color: '#9ca3af' }}>
        Resumen · {mesLabel} {anioLabel}
      </p>

      {/* ── Row 1: Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4">
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

      {/* ── Insights IA ── */}
      <div style={{ marginBottom: 16 }}>
        {[
          { emoji:'🚗', text:'Los SUVs tienen un 23 % más de tasa de aprobación que los carros de ciudad.' },
          { emoji:'💬', text:'Los clientes preguntan más por cobertura contra hurto y fenómenos naturales.' },
          { emoji:'📈', text:'Las pólizas cotizadas en la primera semana del mes tienen mayor cierre.' },
        ].map((ins, i) => (
          <div key={i} style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'#f9f7ff', border:'1px solid #ede9fe',
            borderRadius:10, padding:'7px 14px', marginRight:8, marginBottom:8,
            fontSize:12, color:'#5b21b6', lineHeight:1.4,
          }}>
            <span style={{ fontSize:16, flexShrink:0 }}>{ins.emoji}</span>
            <span>{ins.text}</span>
          </div>
        ))}
      </div>

      {/* ── Row 2: Actividad + Rendimiento ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">

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
            <div style={{ padding: '36px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🚘</div>
              <p style={{ margin:'0 0 4px', fontSize:14, fontWeight:600, color:'#374151' }}>
                Aquí verás tu actividad reciente
              </p>
              <p style={{ margin:'0 0 16px', fontSize:12, color:'#9ca3af', lineHeight:1.5 }}>
                Empieza creando tu primera cotización<br />en menos de 2 minutos.
              </p>
              <button onClick={() => navigate('/dashboard/cotizar')}
                style={{ background:'#2D2A7A', color:'#fff', border:'none', borderRadius:10,
                  padding:'8px 20px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Nueva cotización →
              </button>
            </div>
          ) : (
            <div>
              {actividad.map((a, i) => {
                const badge  = getBadge(a.estado, a.tipo)
                const nombre = a.cliente_nombre || 'Sin nombre'
                // Para cotizaciones la columna "aseguradora" contiene la placa
                const sub    = (a.tipo === 'cotizacion')
                  ? (a.aseguradora && a.aseguradora !== '—' ? `Placa: ${a.aseguradora}` : 'Sin placa')
                  : (a.aseguradora || '—')

                return (
                  <div
                    key={`${a.tipo}-${a.id}-${i}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 20px',
                      borderBottom: i < actividad.length - 1 ? '1px solid #f9fafb' : 'none',
                    }}
                  >
                    {/* Icono: verde si enviada, azul si activa/cerrada */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: a.estado === 'enviada' ? '#dcfce7' : '#dbeafe',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileText size={16} color={a.estado === 'enviada' ? '#16a34a' : '#2563eb'} />
                    </div>

                    {/* Nombre + cédula + placa */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {nombre}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{sub}</div>
                    </div>

                    {/* Tiempo */}
                    <div style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {a.hace}
                    </div>

                    {/* Estado */}
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                      background: badge.bg, color: badge.color, whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {badge.label}
                    </span>
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
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#f3f4f6', color: '#6b7280' }}>
              Este mes
            </span>
          </div>

          {/* Comisiones del mes */}
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>Comisiones generadas</p>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
              {fmt(rendimiento.comisiones_mes)}
            </span>
          </div>

          {/* Bar chart */}
          <div style={{ flex: 1 }}>
            <BarChart data={rendimiento.grafica} color="#2D2A7A" />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {tickDias.map(dia => (
                <span key={dia} style={{ fontSize: 10, color: '#9ca3af' }}>{dia}</span>
              ))}
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
