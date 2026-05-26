import { useState, useEffect } from 'react'
import { DollarSign, Clock, TrendingUp, ChevronDown, ChevronUp, CheckCircle2, Hourglass, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const API   = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function fmt(n) {
  return new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }).format(Number(n) || 0)
}
function fmtShort(n) {
  n = Number(n) || 0
  if (n >= 1_000_000) return `$${(n / 1_000_000 % 1 === 0 ? (n/1_000_000).toFixed(0) : (n/1_000_000).toFixed(1))}M`
  if (n >= 1_000)     return `$${Math.round(n/1_000)}k`
  return `$${n}`
}
function fechaStr(str) {
  if (!str) return '—'
  const d = new Date(str)
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

// ─── Gráfica de barras mensual ────────────────────────────────────────────────
function CommissionsChart({ months }) {
  const hasData = months.some(m => m.valor > 0)
  const max     = Math.max(...months.map(m => m.valor), 1)
  const CHART_H = 110

  return (
    <div style={{ position:'relative' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:CHART_H, pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:0,     left:0, right:0, borderTop:'1px dashed #e2e4ea' }} />
        <div style={{ position:'absolute', top:'50%', left:0, right:0, borderTop:'1px dashed #e2e4ea' }} />
      </div>
      <div style={{ display:'flex', gap:5, alignItems:'flex-end', height:CHART_H, position:'relative' }}>
        {months.map((m, i) => {
          const isCurrent = i === months.length - 1
          const pct = hasData
            ? Math.max((m.valor / max) * 100, m.valor > 0 ? 12 : isCurrent ? 6 : 3)
            : (isCurrent ? 6 : 3)
          const opacity = m.valor > 0 ? 1 : isCurrent ? 0.5 : 0.2
          return (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', height:'100%', justifyContent:'flex-end' }}>
              {m.valor > 0 && (
                <span style={{ fontSize:8.5, fontFamily:'Inter', fontWeight:700, color: isCurrent ? '#4f46e5' : '#9ca3af', marginBottom:3 }}>
                  {fmtShort(m.valor)}
                </span>
              )}
              <div style={{
                width:'72%', borderRadius:'8px 8px 4px 4px',
                background: isCurrent ? '#4f46e5' : '#c7d2fe',
                height:`${pct}%`, minHeight: m.valor > 0 ? 10 : isCurrent ? 5 : 3,
                opacity,
                transition:'height 0.4s ease',
              }} />
            </div>
          )
        })}
      </div>
      <div style={{ display:'flex', gap:5, marginTop:6 }}>
        {months.map((m, i) => {
          const isCurrent = i === months.length - 1
          return (
            <span key={i} style={{ flex:1, textAlign:'center', fontSize:9, fontFamily:'Inter', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color: isCurrent ? '#4f46e5' : '#9ca3af' }}>
              {m.mes}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
  const B = '#f0f1f3'
  const s = (r,h,w='100%') => <div style={{ background:B, borderRadius:r, height:h, width:w, flexShrink:0 }} />
  return (
    <div style={{ padding:'0 0 32px', animation:'skpulse 1.5s ease-in-out infinite' }}>
      <style>{`@keyframes skpulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
      {/* 3 stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
        {/* Card 1 — Ganancias (con gráfico) */}
        <div style={{ background:'#fff', borderRadius:22, padding:'20px 20px 16px', display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            {s(6, 14, 100)}{s(99, 20, 60)}
          </div>
          {/* Chart bars */}
          <div style={{ background:'#f5f7fb', borderRadius:12, padding:'12px 10px' }}>
            <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:80 }}>
              {[55,35,75,45,90,60].map((h,i)=>(
                <div key={i} style={{ flex:1, height:`${h}%`, background:B, borderRadius:'4px 4px 2px 2px' }} />
              ))}
            </div>
            <div style={{ display:'flex', gap:5, marginTop:5 }}>
              {[0,1,2,3,4,5].map(i=><div key={i} style={{ flex:1, height:8, background:B, borderRadius:3 }} />)}
            </div>
          </div>
        </div>
        {/* Card 2 — Próximo pago */}
        <div style={{ background:'#fff', borderRadius:22, padding:'20px 20px 16px', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {s(12, 34, 34)}{s(6, 14, 90)}
          </div>
          {s(6, 32, '70%')}
          {s(5, 12, '55%')}
          <div style={{ borderTop:'1px solid #f0f0f2', paddingTop:14, display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>{s(5,12,'45%')}{s(6,13,'35%')}</div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>{s(5,12,'40%')}{s(6,13,'30%')}</div>
          </div>
        </div>
        {/* Card 3 — Total ganado (gradiente) */}
        <div style={{ borderRadius:22, padding:'20px 20px 16px', background:B, display:'flex', flexDirection:'column', gap:14, minHeight:160 }} />
      </div>
      {/* PagoRow skeletons */}
      {[0,1,2,3].map(i => (
        <div key={i} style={{ background:'#fff', borderRadius:20, border:'1px solid #f0f0f2', marginBottom:10, padding:'16px 20px', display:'flex', alignItems:'center', gap:16 }}>
          {s(14, 42, 42)}
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7 }}>
            {s(5, 14, '45%')}
            {s(5, 12, '65%')}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5, alignItems:'flex-end' }}>
            {s(5, 15, 80)}
            {s(99, 18, 56)}
          </div>
          {s(6, 16, 16)}
        </div>
      ))}
    </div>
  )
}

// ─── Fila de pago expandible ──────────────────────────────────────────────────
function PagoRow({ pago }) {
  const [open, setOpen] = useState(false)
  const pagado  = pago.estado === 'pagado' || pago.estado === 'procesado'
  const mesLabel = pago.mes ? `${MESES_FULL[Number(pago.mes) - 1]} ${pago.anio}` : fechaStr(pago.created_at)
  const polizaIds = pago.poliza_ids ? String(pago.poliza_ids).split(',').filter(Boolean) : []

  return (
    <div style={{ background:'#fff', borderRadius:20, border:'1px solid #f0f0f2', overflow:'hidden', transition:'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Fila principal */}
      <button onClick={() => setOpen(o => !o)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:16, padding:'16px 20px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
        {/* Icono */}
        <div style={{ width:42, height:42, borderRadius:14, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
          background: pagado ? '#dcfce7' : '#fef3c7' }}>
          {pagado
            ? <CheckCircle2 size={19} color="#16a34a" />
            : <Hourglass size={19} color="#d97706" />}
        </div>
        {/* Info principal */}
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:0, fontFamily:'Poppins', fontSize:14, fontWeight:600, color:'#111827' }}>{mesLabel}</p>
          <p style={{ margin:'2px 0 0', fontFamily:'Inter', fontSize:12, color:'#9ca3af' }}>
            {pago.num_polizas || polizaIds.length || 0} póliza{(pago.num_polizas || polizaIds.length) !== 1 ? 's' : ''} · {fechaStr(pago.fecha_pago || pago.created_at)}
          </p>
        </div>
        {/* Monto + estado */}
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <p style={{ margin:0, fontFamily:'Poppins', fontSize:15, fontWeight:700, color: pagado ? '#16a34a' : '#d97706' }}>
            {fmt(pago.monto)}
          </p>
          <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99,
            background: pagado ? '#dcfce7' : '#fef3c7',
            color:      pagado ? '#16a34a' : '#d97706' }}>
            {pagado ? 'Depositado' : 'Pendiente'}
          </span>
        </div>
        {/* Chevron */}
        <div style={{ flexShrink:0, color:'#9ca3af', marginLeft:4 }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Detalle expandido */}
      {open && (
        <div style={{ borderTop:'1px solid #f3f4f6', padding:'16px 20px', background:'#fafafa' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom: polizaIds.length ? 14 : 0 }}>
            <Detail label="Mes de comisión" value={mesLabel} />
            <Detail label="Fecha de depósito" value={fechaStr(pago.fecha_pago || pago.created_at)} />
            <Detail label="Monto depositado" value={fmt(pago.monto)} />
            <Detail label="Estado" value={pagado ? 'Depositado ✓' : 'Pendiente'} color={pagado ? '#16a34a' : '#d97706'} />
            {(pago.num_polizas || polizaIds.length) > 0 && (
              <Detail label="Pólizas incluidas" value={`${pago.num_polizas || polizaIds.length}`} />
            )}
          </div>
          {polizaIds.length > 0 && (
            <div>
              <p style={{ margin:'0 0 8px', fontFamily:'Inter', fontSize:11, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                IDs de pólizas
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {polizaIds.map(id => (
                  <span key={id} style={{ fontFamily:'Inter', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:99, background:'#ede9fe', color:'#6d28d9' }}>
                    #{id}
                  </span>
                ))}
              </div>
            </div>
          )}
          {pago.observaciones && (
            <div style={{ marginTop:12, padding:'10px 14px', background:'#fff7ed', borderRadius:12, borderLeft:'3px solid #fb923c' }}>
              <p style={{ margin:0, fontFamily:'Inter', fontSize:12, color:'#9a3412' }}>{pago.observaciones}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Detail({ label, value, color }) {
  return (
    <div>
      <p style={{ margin:0, fontFamily:'Inter', fontSize:10, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>{label}</p>
      <p style={{ margin:0, fontFamily:'Poppins', fontSize:13, fontWeight:600, color: color || '#111827' }}>{value}</p>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MisPagos() {
  const { getToken } = useAuth()
  const [pagos,    setPagos]    = useState([])
  const [proximo,  setProximo]  = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` }
    const opts    = { headers, credentials: 'include' }
    Promise.all([
      fetch(`${API}/api/pagos`,          opts).then(r => r.json()),
      fetch(`${API}/api/pagos/proximo`,  opts).then(r => r.json()),
    ])
      .then(([pr, px]) => {
        if (pr.status === 'success') setPagos(pr.data)
        if (px.status === 'success') setProximo(px.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Total histórico (suma de todos los pagos ya realizados)
  const totalHistorico = pagos
    .filter(p => p.estado === 'pagado' || p.estado === 'procesado')
    .reduce((acc, p) => acc + Number(p.monto || 0), 0)

  // Gráfica: últimos 6 meses
  const now = new Date()
  const chartMeses = Array.from({ length: 6 }, (_, i) => {
    const d    = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const mes  = d.getMonth() + 1
    const anio = d.getFullYear()
    const valor = pagos
      .filter(p => Number(p.mes) === mes && Number(p.anio) === anio && (p.estado === 'pagado' || p.estado === 'procesado'))
      .reduce((acc, p) => acc + Number(p.monto || 0), 0)
    return { mes: MESES[mes - 1], anio, valor }
  })

  const mesActual     = MESES[now.getMonth()]
  const proximoMesLabel = proximo?.fecha_pago
    ? (() => { const [d,m,y] = proximo.fecha_pago.split('/'); return `1 ${MESES[parseInt(m)-1]} ${y}` })()
    : '—'

  if (loading) return (
    <div style={{ padding:'0 24px 32px' }}><div style={{ maxWidth:'72rem', margin:'0 auto' }}><Skeleton /></div></div>
  )

  return (
    <div style={{ padding:'0 24px 32px' }}>
      <div style={{ maxWidth:'72rem', margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom:24, paddingTop:8 }}>
        <h1 style={{ fontFamily:'Poppins', fontSize:22, fontWeight:700, color:'#111827', margin:0 }}>Comisiones</h1>
        <p style={{ fontFamily:'Inter', fontSize:13, color:'#9ca3af', margin:'4px 0 0' }}>
          Acá ves lo que te hemos pagado y lo que está por pagarte. Los depósitos se hacen el 1 de cada mes.
        </p>
      </div>

      {/* ── 3 cards superiores ──────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginBottom:24 }}>

        {/* Card 1: Gráfica */}
        <div style={{ background:'#fff', borderRadius:22, padding:'20px 20px 16px', gridColumn:'1 / span 1' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <span style={{ fontFamily:'Poppins', fontWeight:600, fontSize:14, color:'#111827' }}>Ganancias por mes</span>
            <span style={{ fontFamily:'Inter', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', padding:'3px 8px', borderRadius:99, background:'#f5f7fb', color:'#9ca3af' }}>
              Últ. 6 meses
            </span>
          </div>
          <CommissionsChart months={chartMeses} />
        </div>

        {/* Card 2: Próximo pago */}
        <div style={{ background:'#fff', borderRadius:22, padding:'20px 20px 16px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <div style={{ width:34, height:34, borderRadius:12, background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Clock size={16} color="#d97706" />
              </div>
              <span style={{ fontFamily:'Poppins', fontWeight:600, fontSize:14, color:'#111827' }}>Próximo pago</span>
            </div>
            <p style={{ margin:'0 0 4px', fontFamily:'Poppins', fontSize:28, fontWeight:800, color:'#111827', letterSpacing:'-0.5px' }}>
              {fmt(proximo?.monto ?? 0)}
            </p>
            <p style={{ margin:0, fontFamily:'Inter', fontSize:12, color:'#9ca3af' }}>
              {proximo?.polizas ?? 0} póliza{proximo?.polizas !== 1 ? 's' : ''} aprobadas este mes
            </p>
          </div>
          <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid #f0f0f2' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontFamily:'Inter', fontSize:12, color:'#9ca3af' }}>Fecha estimada</span>
              <span style={{ fontFamily:'Poppins', fontSize:13, fontWeight:600, color:'#374151' }}>{proximoMesLabel}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total histórico */}
        <div style={{ background:'linear-gradient(135deg, #3730a3 0%, #4f46e5 100%)', borderRadius:22, padding:'20px 20px 16px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <div style={{ width:34, height:34, borderRadius:12, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <TrendingUp size={16} color="#fff" />
              </div>
              <span style={{ fontFamily:'Poppins', fontWeight:600, fontSize:14, color:'#fff' }}>Total ganado</span>
            </div>
            <p style={{ margin:'0 0 4px', fontFamily:'Poppins', fontSize:28, fontWeight:800, color:'#fff', letterSpacing:'-0.5px' }}>
              {fmt(totalHistorico)}
            </p>
            <p style={{ margin:0, fontFamily:'Inter', fontSize:12, color:'rgba(255,255,255,0.6)' }}>
              En {pagos.filter(p => p.estado === 'pagado' || p.estado === 'procesado').length} pago{pagos.filter(p => p.estado === 'pagado' || p.estado === 'procesado').length !== 1 ? 's' : ''} realizados
            </p>
          </div>
          <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontFamily:'Inter', fontSize:12, color:'rgba(255,255,255,0.6)' }}>Mejor mes</span>
              <span style={{ fontFamily:'Poppins', fontSize:13, fontWeight:600, color:'#fff' }}>
                {fmtShort(Math.max(...chartMeses.map(m => m.valor)))}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Historial de pagos ─────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 4px', marginBottom:12 }}>
        <span style={{ fontFamily:'Poppins', fontWeight:600, fontSize:14, color:'#111827' }}>Historial de pagos</span>
        {pagos.length > 0 && (
          <span style={{ fontFamily:'Inter', fontSize:12, color:'#9ca3af' }}>{pagos.length} registro{pagos.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {pagos.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:22, border:'1px solid #f0f0f2', padding:'48px 24px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
          <div style={{ width:56, height:56, borderRadius:20, background:'#f5f7fb', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
            <DollarSign size={24} color="#d1d5db" />
          </div>
          <p style={{ margin:'0 0 6px', fontFamily:'Poppins', fontSize:15, fontWeight:600, color:'#374151' }}>Sin pagos aún</p>
          <p style={{ margin:0, fontFamily:'Inter', fontSize:13, color:'#9ca3af', maxWidth:280, lineHeight:1.6 }}>
            Tu historial aparecerá aquí cuando se realice el primer depósito. Los pagos se hacen el 1 de cada mes.
          </p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {pagos.map(p => <PagoRow key={p.id} pago={p} />)}
        </div>
      )}

      </div>
    </div>
  )
}
