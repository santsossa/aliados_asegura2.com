import { useState, useEffect } from 'react'
import { Shield, X, Info } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSSE } from '../../context/SSEContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const fmt = n => n ? ('$' + Math.round(n).toLocaleString('es-CO')) : '—'

const ESTADOS = {
  en_proceso:    { bg:'#fef3c7', color:'#d97706', label:'En trámite',    desc:'Tu cliente está siendo contactado por nuestro equipo. Te avisamos cuando haya novedades.' },
  aprobada:      { bg:'#dcfce7', color:'#16a34a', label:'Aprobado ✓',    desc:'¡El cliente pagó! Tu comisión queda lista para el pago del 1 del mes.' },
  no_convertida: { bg:'#fee2e2', color:'#dc2626', label:'No aprobado',   desc:'Esta póliza no se pudo emitir. Nuestro equipo dejó el motivo abajo.' },
}

function Badge({ estado }) {
  const e = ESTADOS[estado] || ESTADOS.en_proceso
  return (
    <span style={{ background:e.bg, color:e.color, fontSize:11, fontWeight:700,
                   padding:'4px 12px', borderRadius:99, whiteSpace:'nowrap' }}>
      {e.label}
    </span>
  )
}

function fechaStr(d) {
  const f = new Date(d)
  return `${f.getDate()} ${MESES[f.getMonth()]} ${f.getFullYear()}`
}

/* ── Sección del modal ─────────────────────────────────────────────────── */
function Sec({ title, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase',
                    letterSpacing:'0.08em', marginBottom:8 }}>{title}</div>
      <div style={{ background:'#f9fafb', borderRadius:12, overflow:'hidden' }}>
        {children}
      </div>
    </div>
  )
}
function Row({ label, value, highlight }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'9px 14px', borderBottom:'1px solid #f3f4f6' }}>
      <span style={{ fontSize:12, color:'#6b7280' }}>{label}</span>
      <span style={{ fontSize:13, fontWeight: highlight ? 700 : 500,
                     color: highlight ? '#16a34a' : '#111827' }}>{value || '—'}</span>
    </div>
  )
}

/* ── Modal de detalle ───────────────────────────────────────────────────── */
function DetalleModal({ item, onClose, token }) {
  const [det,     setDet]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // cotizacion_id viene directo del item (ya incluido en el query de /me/polizas)
    const cotId = item.cotizacion_id
    if (!cotId) { setLoading(false); return }
    fetch(`${API}/api/aliados/me/cotizaciones/${cotId}/detalle`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setDet(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [item])

  // Estado: si hay detalle del servidor úsalo, si no el del item
  const estadoActual = det?.poliza_estado || item.estado || 'en_proceso'
  const E = ESTADOS[estadoActual] || ESTADOS.en_proceso

  // Campos con fallback a item (ya enriquecido por el JOIN en /me/polizas)
  const clienteNombre   = det?.cliente_nombre   || item.cliente_nombre   || '—'
  const clienteTelefono = det?.cliente_telefono || det?.lead_telefono    || item.cliente_telefono || '—'
  const clienteCorreo   = det?.cliente_correo   || item.cliente_correo   || '—'
  const clienteCedula   = det?.cliente_cedula   || item.cliente_cedula
  const clienteTipoDoc  = det?.cliente_tipo_doc || item.cliente_tipo_doc
  const placa           = det?.placa            || item.placa
  const comercialValue  = det?.comercial_value  || item.comercial_value
  const aseguradora     = det?.aseguradora      || item.aseguradora      || '—'
  const valorPrima      = det?.valor_prima      || item.valor_prima      || 0
  const valorComision   = det?.valor_comision   || item.valor_comision   || Math.round(valorPrima * 0.06)
  const observaciones   = det?.observaciones    || item.observaciones
  const createdAt       = det?.created_at       || item.created_at

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:500,
                  display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
         onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:520,
                    maxHeight:'88vh', overflowY:'auto',
                    boxShadow:'0 24px 64px rgba(0,0,0,0.18)' }}
           onClick={e => e.stopPropagation()}>

        {/* Cabecera */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'20px 24px 16px', borderBottom:'1px solid #f3f4f6', position:'sticky', top:0, background:'#fff', zIndex:1 }}>
          <div>
            <h2 style={{ fontSize:17, fontWeight:800, color:'#111827', margin:0 }}>
              Seguimiento de póliza
            </h2>
            <p style={{ fontSize:12, color:'#9ca3af', margin:'2px 0 0' }}>
              {clienteNombre} · {aseguradora}
            </p>
          </div>
          <button onClick={onClose}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4,
                     display:'flex', alignItems:'center' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding:'20px 24px' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:'32px 0', color:'#9ca3af', fontSize:14 }}>Cargando detalles...</div>
          ) : (
            <>
              {/* Estado actual */}
              <div style={{ background:E.bg, borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:E.color, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                    Estado actual
                  </span>
                  <Badge estado={estadoActual} />
                </div>
                <p style={{ fontSize:12, color:'#6b7280', margin:0, lineHeight:1.5 }}>{E.desc}</p>
              </div>

              {/* Cliente */}
              <Sec title="Datos del cliente">
                <Row label="Nombre"   value={clienteNombre} />
                {clienteTipoDoc && clienteCedula && (
                  <Row label="Documento" value={`${clienteTipoDoc} ${clienteCedula}`} />
                )}
                <Row label="Teléfono" value={clienteTelefono} />
                <Row label="Correo"   value={clienteCorreo} />
              </Sec>

              {/* Vehículo */}
              <Sec title="Vehículo">
                <Row label="Placa"           value={placa} />
                <Row label="Valor asegurado" value={comercialValue ? fmt(comercialValue) : null} />
              </Sec>

              {/* Póliza y comisión */}
              <Sec title="Póliza y tu comisión">
                <Row label="Aseguradora"     value={aseguradora} />
                <Row label="Prima anual"     value={fmt(valorPrima)} />
                <Row label="Tu comisión (6%)" value={fmt(valorComision)} highlight />
              </Sec>

              {/* Fechas */}
              <Sec title="Seguimiento">
                <Row label="Lead enviado" value={fechaStr(createdAt)} />
                {estadoActual === 'aprobada' && (det?.mes || item.mes) &&
                  <Row label="Pago programado"
                       value={`1 de ${MESES[((det?.mes || item.mes) - 1)]} ${det?.anio || item.anio}`}
                       highlight />}
              </Sec>

              {/* Mensaje del equipo según estado */}
              {estadoActual === 'no_convertida' ? (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase',
                                letterSpacing:'0.08em', marginBottom:8 }}>Mensaje del equipo Asegura2.com</div>
                  {observaciones ? (
                    <div style={{ background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:12,
                                  padding:'14px 16px', fontSize:13, color:'#991b1b', lineHeight:1.7 }}>
                      {observaciones}
                    </div>
                  ) : (
                    <div style={{ background:'#fef2f2', borderRadius:12, padding:'14px 16px',
                                  fontSize:13, color:'#dc2626', lineHeight:1.6 }}>
                      Esta póliza no se pudo emitir. Nuestro equipo pronto agregará el motivo aquí.
                    </div>
                  )}
                </div>
              ) : estadoActual === 'aprobada' ? (
                <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:12,
                              padding:'14px 16px', fontSize:13, color:'#166534',
                              display:'flex', gap:10, alignItems:'flex-start', lineHeight:1.6 }}>
                  <span style={{ fontSize:22 }}>🎉</span>
                  <span>
                    <strong>¡Felicitaciones!</strong> El cliente pagó la póliza.
                    Tu comisión quedará incluida en el pago del <strong>1 del próximo mes</strong>.
                    {observaciones && <><br/><br/><em>{observaciones}</em></>}
                  </span>
                </div>
              ) : (
                <div style={{ background:'#eff6ff', borderRadius:12, padding:'14px 16px',
                              fontSize:13, color:'#1d4ed8', display:'flex', gap:10, alignItems:'flex-start', lineHeight:1.6 }}>
                  <Info size={16} style={{ flexShrink:0, marginTop:1 }} />
                  <span>
                    Nuestro equipo está en contacto con tu cliente para gestionar la emisión.
                    Recibirás un correo cuando cambie el estado.
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function MisPolizas() {
  const { getToken } = useAuth()
  const { subscribe } = useSSE()
  const [data,    setData]    = useState({ leads: [], polizas: [] })
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)
  const [tab,     setTab]     = useState('en_proceso')

  useEffect(() => {
    fetch(`${API}/api/aliados/me/polizas`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      credentials: 'include',
    })
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setData(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Actualizaciones en vivo ───────────────────────────────────────────────
  useEffect(() => {
    return subscribe('poliza_update', (ev) => {
      setData(prev => {
        // Actualizar en leads (en_proceso)
        const leads = prev.leads.map(l =>
          l.id === ev.lead_id
            ? { ...l, estado: ev.estado, aseguradora: ev.aseguradora ?? l.aseguradora,
                valor_prima: ev.valor_prima ?? l.valor_prima }
            : l
        )
        // Actualizar en polizas (aprobada / no_convertida)
        let polizas = prev.polizas.map(p =>
          p.id === ev.poliza_id
            ? { ...p, estado: ev.estado, valor_comision: ev.valor_comision ?? p.valor_comision }
            : p
        )
        // Si la poliza es nueva (recién creada por el admin) y no está en la lista, agregarla
        if (ev.poliza_id && !polizas.some(p => p.id === ev.poliza_id) && ev.estado !== 'en_proceso') {
          polizas = [
            {
              id: ev.poliza_id, _tipo: 'poliza',
              cliente_nombre: ev.cliente_nombre, aseguradora: ev.aseguradora,
              valor_prima: ev.valor_prima, valor_comision: ev.valor_comision,
              estado: ev.estado, placa: ev.placa,
              created_at: ev.created_at || new Date().toISOString(),
            },
            ...polizas,
          ]
        }
        return { leads, polizas }
      })
      // Si el modal abierto es el item que cambió, actualizar su estado también
      setModal(prev => {
        if (!prev) return prev
        if (prev.id === ev.lead_id || prev.id === ev.poliza_id)
          return { ...prev, estado: ev.estado }
        return prev
      })
    })
  }, [subscribe])

  const allItems = [
    ...data.polizas.map(p => ({ ...p, _tipo:'poliza' })),
    ...data.leads.map(l  => ({ ...l,  _tipo:'lead', estado:'en_proceso' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const tabs = [
    { key:'en_proceso',    label:'En trámite',  E: ESTADOS.en_proceso    },
    { key:'aprobada',      label:'Aprobadas',   E: ESTADOS.aprobada      },
    { key:'no_convertida', label:'No aprobado', E: ESTADOS.no_convertida },
  ]
  const filtered = allItems.filter(it => it.estado === tab)

  function ItemCard({ item }) {
    return (
      <button
        onClick={() => setModal(item)}
        style={{ width:'100%', textAlign:'left', background:'none', border:'none', padding:0, cursor:'pointer' }}
      >
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:border-brand/40 hover:shadow-md transition-all">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div style={{ width:40, height:40, borderRadius:12, flexShrink:0,
                            background: ESTADOS[tab]?.bg || '#f3f4f6',
                            display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Shield size={18} style={{ color: ESTADOS[tab]?.color || '#6b7280' }} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.cliente_nombre || 'Cliente'}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.aseguradora || '—'}
                  {item.placa ? ` · ${item.placa}` : ''}
                  {' · '}{fechaStr(item.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">{fmt(item.valor_prima)}</p>
                {item.valor_comision
                  ? <p className="text-xs text-green-600 font-medium">Comisión: {fmt(item.valor_comision)}</p>
                  : <p className="text-xs text-gray-400">Comisión: {fmt(Math.round((item.valor_prima||0)*0.06))}</p>
                }
              </div>
              <span style={{ color:'#d1d5db', fontSize:18, lineHeight:1 }}>›</span>
            </div>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis pólizas</h1>
        <p className="text-gray-500 text-sm mt-1">
          Acá puedes ver el estado de cada póliza que enviaste a emitir. Toca cualquiera para saber qué está pasando con ese cliente y cuánto ganarás si se aprueba.
        </p>
      </div>

      {/* Pestañas */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {tabs.map(t => {
          const count = allItems.filter(it => it.estado === t.key).length
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'10px 18px', borderRadius:12, border:'none', cursor:'pointer',
                fontWeight: active ? 700 : 500, fontSize:14,
                background: active ? t.E.bg : '#f3f4f6',
                color:      active ? t.E.color : '#6b7280',
                transition:'all 0.15s',
                boxShadow:  active ? `0 0 0 2px ${t.E.color}33` : 'none',
              }}>
              {t.label}
              <span style={{
                background: active ? t.E.color : '#d1d5db',
                color:'#fff', fontSize:11, fontWeight:700,
                padding:'1px 7px', borderRadius:99, minWidth:20, textAlign:'center',
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Descripción del estado activo */}
      <div style={{ background: ESTADOS[tab]?.bg, borderRadius:12, padding:'10px 16px',
                    marginBottom:16, fontSize:13, color: ESTADOS[tab]?.color, lineHeight:1.5 }}>
        {ESTADOS[tab]?.desc}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <Shield size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium text-sm">Sin pólizas en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => <ItemCard key={`${item._tipo}-${item.id}`} item={item} />)}
        </div>
      )}

      {modal && (
        <DetalleModal
          item={modal}
          token={getToken()}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
