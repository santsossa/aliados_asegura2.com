import { useState, useEffect, useCallback } from 'react'
import { Shield, X, Info } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSSE } from '../../context/SSEContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const fmt = n => n ? ('$' + Math.round(n).toLocaleString('es-CO')) : '—'

const LOGO_MAP = {
  allianz: '/logos/allianz.webp', axa: '/logos/axa.webp',
  colpatria: '/logos/axa.webp',   bolivar: '/logos/bolivar.webp',
  equidad: '/logos/equidad.webp', hdi: '/logos/hdi.webp',
  mapfre: '/logos/mapfre.webp',   sbs: '/logos/sbs.webp',
  solidaria: '/logos/solidaria.webp', sura: '/logos/sura.webp',
  estado: '/logos/estado.webp',   coomeva: '/logos/coomeva.webp',
  qualitas: '/logos/qualitas.webp',
}
function getLogoUrl(nombre) {
  if (!nombre) return null
  const key = nombre.toLowerCase()
  const match = Object.keys(LOGO_MAP).find(k => key.includes(k))
  return match ? LOGO_MAP[match] : null
}

const ESTADOS = {
  lead:           { bg:'#f0f9ff', color:'#0ea5e9', label:'Recibido',
                    desc:'Recibimos tu solicitud. Ya tenemos al cliente en nuestro sistema.' },
  en_contacto:    { bg:'#e0f2fe', color:'#0284c7', label:'En contacto',
                    desc:'Nuestro equipo está intentando contactarse con el cliente para seguir con su proceso.' },
  en_proceso:     { bg:'#fef3c7', color:'#d97706', label:'En gestión',
                    desc:'El cliente muestra interés en tomar la póliza y estamos haciendo los trámites para que la pueda tomar.' },
  poliza_emitida: { bg:'#ede9fe', color:'#7c3aed', label:'Póliza emitida',
                    desc:'Se emitió la póliza con la aseguradora y estamos a la espera de recibir el primer pago del cliente.' },
  aprobada:       { bg:'#dcfce7', color:'#16a34a', label:'Aprobado ✓',
                    desc:'¡El cliente pagó! Tu comisión queda lista para el pago del 1 del mes.' },
  no_convertida:  { bg:'#fee2e2', color:'#dc2626', label:'No aprobado',
                    desc:'Esta póliza no se pudo emitir. Nuestro equipo dejó el motivo abajo.' },
}

const EN_TRAMITE = new Set(['lead', 'en_contacto', 'en_proceso', 'poliza_emitida'])

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

  const estadoActual = det?.poliza_estado || item.estado || 'en_proceso'
  const E = ESTADOS[estadoActual] || ESTADOS.en_proceso

  const clienteNombre   = det?.cliente_nombre   || item.cliente_nombre   || '—'
  const clienteTelefono = det?.cliente_telefono || det?.lead_telefono    || item.cliente_telefono || '—'
  const clienteCorreo   = det?.cliente_correo   || item.cliente_correo   || '—'
  const clienteCedula   = det?.cliente_cedula   || item.cliente_cedula
  const clienteTipoDoc  = det?.cliente_tipo_doc || item.cliente_tipo_doc
  const placa           = det?.placa            || item.placa
  const comercialValue  = det?.comercial_value  || item.comercial_value
  const aseguradora     = det?.aseguradora      || item.aseguradora      || '—'
  const valorPrima      = det?.valor_prima      || item.valor_prima      || 0
  const valorComision   = det?.valor_comision   || item.valor_comision   || Math.round(valorPrima / 1.19 * 0.06)
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

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'20px 24px 16px', borderBottom:'1px solid #f3f4f6',
                      position:'sticky', top:0, background:'#fff', zIndex:1 }}>
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
          ) : estadoActual === 'no_convertida' ? (
            <>
              <div style={{ background:E.bg, borderRadius:12, padding:'12px 16px', marginBottom:18,
                            display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:18 }}>❌</span>
                <div>
                  <p style={{ margin:0, fontSize:13, fontWeight:700, color:E.color }}>Póliza no aprobada</p>
                  <p style={{ margin:'2px 0 0', fontSize:12, color:'#6b7280' }}>Esta póliza no pudo ser emitida.</p>
                </div>
              </div>
              <Sec title="Vehículo">
                <Row label="Placa"           value={placa} />
                <Row label="Aseguradora"     value={aseguradora} />
                <Row label="Valor asegurado" value={comercialValue ? fmt(comercialValue) : null} />
                <Row label="Prima cotizada"  value={fmt(valorPrima)} />
              </Sec>
              <Sec title="Datos del cliente">
                <Row label="Nombre"   value={clienteNombre} />
                {clienteTipoDoc && clienteCedula && (
                  <Row label="Documento" value={`${clienteTipoDoc} ${clienteCedula}`} />
                )}
                <Row label="Teléfono" value={clienteTelefono} />
                <Row label="Correo"   value={clienteCorreo} />
              </Sec>
              <div style={{ marginBottom:4 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase',
                              letterSpacing:'0.08em', marginBottom:8 }}>
                  Motivo de no aprobación
                </div>
                {observaciones ? (
                  <div style={{ background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:12,
                                padding:'16px', fontSize:14, color:'#991b1b', lineHeight:1.75, fontWeight:500 }}>
                    {observaciones}
                  </div>
                ) : (
                  <div style={{ background:'#fef2f2', borderRadius:12, padding:'14px 16px',
                                fontSize:13, color:'#dc2626', lineHeight:1.6 }}>
                    El equipo de Asegura2 pronto agregará el motivo aquí.
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ background:E.bg, borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:E.color, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                    Estado actual
                  </span>
                  <Badge estado={estadoActual} />
                </div>
                <p style={{ fontSize:12, color:'#6b7280', margin:0, lineHeight:1.5 }}>{E.desc}</p>
              </div>
              <Sec title="Datos del cliente">
                <Row label="Nombre"   value={clienteNombre} />
                {clienteTipoDoc && clienteCedula && (
                  <Row label="Documento" value={`${clienteTipoDoc} ${clienteCedula}`} />
                )}
                <Row label="Teléfono" value={clienteTelefono} />
                <Row label="Correo"   value={clienteCorreo} />
              </Sec>
              <Sec title="Vehículo">
                <Row label="Placa"           value={placa} />
                <Row label="Valor asegurado" value={comercialValue ? fmt(comercialValue) : null} />
              </Sec>
              <Sec title="Póliza y tu comisión">
                <Row label="Aseguradora"              value={aseguradora} />
                <Row label="Prima anual (con IVA)"    value={fmt(valorPrima)} />
                <Row label="Prima sin IVA (÷1,19)"    value={fmt(Math.round(valorPrima / 1.19))} />
                <Row label="Tu comisión (6% s/IVA)"   value={fmt(valorComision)} highlight />
              </Sec>
              <Sec title="Seguimiento">
                <Row label="Lead enviado" value={fechaStr(createdAt)} />
                {estadoActual === 'aprobada' && (det?.mes || item.mes) &&
                  <Row label="Pago programado"
                       value={`1 de ${MESES[((det?.mes || item.mes) - 1)]} ${det?.anio || item.anio}`}
                       highlight />}
              </Sec>
              {estadoActual === 'aprobada' ? (
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
              ) : estadoActual === 'poliza_emitida' ? (
                <div style={{ background:'#f5f3ff', border:'1.5px solid #ddd6fe', borderRadius:12,
                              padding:'14px 16px', fontSize:13, color:'#5b21b6',
                              display:'flex', gap:10, alignItems:'flex-start', lineHeight:1.6 }}>
                  <span style={{ fontSize:22 }}>📋</span>
                  <span>
                    <strong>Póliza emitida.</strong> Al cliente ya se le emitió la póliza
                    con <strong>{aseguradora}</strong>. Estamos a la espera de recibir el primer pago del cliente.
                  </span>
                </div>
              ) : estadoActual === 'en_contacto' ? (
                <div style={{ background:'#e0f2fe', border:'1.5px solid #7dd3fc', borderRadius:12,
                              padding:'14px 16px', fontSize:13, color:'#0369a1',
                              display:'flex', gap:10, alignItems:'flex-start', lineHeight:1.6 }}>
                  <Info size={16} style={{ flexShrink:0, marginTop:1 }} />
                  <span>
                    Nuestro equipo está intentando contactarse con el cliente para seguir con su proceso.
                    Te notificaremos cuando haya novedades.
                  </span>
                </div>
              ) : estadoActual === 'en_proceso' ? (
                <div style={{ background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:12,
                              padding:'14px 16px', fontSize:13, color:'#92400e',
                              display:'flex', gap:10, alignItems:'flex-start', lineHeight:1.6 }}>
                  <Info size={16} style={{ flexShrink:0, marginTop:1 }} />
                  <span>
                    El cliente muestra interés en tomar la póliza y estamos haciendo los trámites
                    para que la pueda tomar. Recibirás una notificación cuando haya novedades.
                  </span>
                </div>
              ) : (
                <div style={{ background:'#f0f9ff', border:'1.5px solid #bae6fd', borderRadius:12,
                              padding:'14px 16px', fontSize:13, color:'#0369a1',
                              display:'flex', gap:10, alignItems:'flex-start', lineHeight:1.6 }}>
                  <span style={{ fontSize:22 }}>✅</span>
                  <span>
                    <strong>¡Lo recibimos!</strong> Ya tenemos al cliente en nuestro sistema.
                    Nuestro equipo de ventas se pondrá en contacto con él para continuar con los trámites
                    y cerrar la póliza. Te notificaremos cuando haya novedades.
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
  const { getToken }       = useAuth()
  const { subscribe }      = useSSE()
  const [searchParams]     = useSearchParams()
  const [data,    setData] = useState({ leads: [], polizas: [] })
  const [loading,      setLoading]      = useState(true)
  const [modal,        setModal]        = useState(null)
  const [legendModal,  setLegendModal]  = useState(false)
  const [tab, setTab] = useState(() => searchParams.get('tab') || 'en_tramite')

  const fetchData = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    fetch(`${API}/api/aliados/me/polizas`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      credentials: 'include',
    })
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setData(d.data) })
      .catch(() => {})
      .finally(() => { if (!silent) setLoading(false) })
  }, [getToken])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    return subscribe('__refresh', () => fetchData(true))
  }, [subscribe, fetchData])

  useEffect(() => {
    return subscribe('poliza_update', (ev) => {
      setData(prev => {
        const leads = ev.lead_id
          ? prev.leads.filter(l => l.id !== ev.lead_id)
          : prev.leads
        let polizas = prev.polizas.map(p =>
          p.id === ev.poliza_id
            ? { ...p, estado: ev.estado, valor_comision: ev.valor_comision ?? p.valor_comision }
            : p
        )
        if (ev.poliza_id && !polizas.some(p => p.id === ev.poliza_id)) {
          polizas = [
            {
              id: ev.poliza_id, _tipo: 'poliza',
              cliente_nombre: ev.cliente_nombre, aseguradora: ev.aseguradora,
              valor_prima: ev.valor_prima, valor_comision: ev.valor_comision,
              estado: ev.estado, placa: ev.placa,
              cotizacion_id: ev.cotizacion_id || null,
              created_at: ev.created_at || new Date().toISOString(),
            },
            ...polizas,
          ]
        }
        return { leads, polizas }
      })
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
    ...data.leads.map(l  => ({ ...l, _tipo:'lead', estado:'lead' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const tabs = [
    { key:'en_tramite',    label:'En trámite',  E: ESTADOS.en_proceso    },
    { key:'aprobada',      label:'Aprobadas',   E: ESTADOS.aprobada      },
    { key:'no_convertida', label:'No aprobado', E: ESTADOS.no_convertida },
  ]

  const filtered = tab === 'en_tramite'
    ? allItems.filter(it => EN_TRAMITE.has(it.estado))
    : allItems.filter(it => it.estado === tab)

  /* ── Card estilo "enviadas a emitir" ─────────────────────────────────── */
  function ItemCard({ item }) {
    const aseguradoraLogo = getLogoUrl(item.aseguradora)
    const estadoCfg = (tab === 'en_tramite' ? ESTADOS[item.estado] : ESTADOS[tab]) || ESTADOS.en_proceso

    return (
      <button
        onClick={() => setModal(item)}
        style={{ width:'100%', textAlign:'left', background:'none', border:'none', padding:0, cursor:'pointer' }}
      >
        <div
          style={{
            background: '#f5f7fb', borderRadius: 20, overflow: 'hidden',
            display: 'flex', flexDirection: 'column', height: '100%',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#eceef4'}
          onMouseLeave={e => e.currentTarget.style.background = '#f5f7fb'}
        >
          {/* Área de logo */}
          <div style={{ height: 90, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {aseguradoraLogo
              ? <img src={aseguradoraLogo} alt={item.aseguradora} width={120} height={46}
                  style={{ maxHeight: 46, maxWidth: 120, objectFit: 'contain' }}
                  loading="lazy" decoding="async" />
              : <div style={{ width: 44, height: 44, borderRadius: 12, background: estadoCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🚗</div>
            }
          </div>

          {/* Info */}
          <div style={{ padding: '11px 13px 13px', display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
            {tab === 'en_tramite' && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                background: estadoCfg.bg, color: estadoCfg.color,
                whiteSpace: 'nowrap', alignSelf: 'flex-start',
              }}>
                {estadoCfg.label}
              </span>
            )}
            <p style={{ margin: 0, fontFamily: 'Poppins', fontSize: 13, fontWeight: 600, color: '#111827',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.cliente_nombre || 'Cliente'}
            </p>
            <p style={{ margin: 0, fontFamily: 'Inter', fontSize: 11, color: '#9ca3af',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {[item.placa, item.aseguradora].filter(Boolean).join(' · ') || '—'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6 }}>
              {item.estado === 'aprobada' && item.valor_comision > 0
                ? <span style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 700, color: '#16a34a' }}>+{fmt(item.valor_comision)}</span>
                : item.valor_prima > 0
                ? <span style={{ fontFamily: 'Inter', fontSize: 11, color: '#9ca3af' }}>{fmt(item.valor_prima)}</span>
                : <span />
              }
              <span style={{ fontFamily: 'Inter', fontSize: 10, color: '#b0b4c1' }}>{fechaStr(item.created_at)}</span>
            </div>
          </div>
        </div>
      </button>
    )
  }

  /* ── Leyenda de estados ───────────────────────────────────────────────── */
  const EN_TRAMITE_LEGEND = [
    { estado:'lead',           emoji:'📥', text:'Enviaste la solicitud. Ya la tenemos y pronto nuestro equipo la gestiona.' },
    { estado:'en_contacto',    emoji:'📞', text:'Nuestro asesor está intentando comunicarse con el cliente para avanzar.' },
    { estado:'en_proceso',     emoji:'📋', text:'El cliente quiere la póliza. Estamos haciendo los trámites para emitirla.' },
    { estado:'poliza_emitida', emoji:'✍️', text:'Ya se emitió la póliza. Esperamos que el cliente realice su primer pago.' },
  ]

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth:'72rem', margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 20, paddingTop: 8 }}>
        <h1 style={{ fontFamily:'Poppins', fontSize:22, fontWeight:700, color:'#111827', margin:0 }}>Mis pólizas</h1>
        <p style={{ fontFamily:'Inter', fontSize:13, color:'#9ca3af', margin:'4px 0 0' }}>
          Acá puedes ver el estado de cada póliza que enviaste a emitir. Toca cualquiera para saber qué está pasando.
        </p>
      </div>

      {/* Tabs */}
      <div className="mis-polizas-tabs" style={{ display:'flex', alignItems:'center', gap:8, marginBottom: tab === 'en_tramite' ? 10 : 20 }}>
        {tabs.map(t => {
          const count = t.key === 'en_tramite'
            ? allItems.filter(it => EN_TRAMITE.has(it.estado)).length
            : allItems.filter(it => it.estado === t.key).length
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="mis-polizas-tab"
              style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'10px 18px', borderRadius:12, border:'none', cursor:'pointer',
                fontWeight: active ? 700 : 500, fontSize:14, fontFamily:'Poppins',
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

      {/* Botón de leyenda — fila propia, solo en "En trámite" */}
      {tab === 'en_tramite' && (
        <div style={{ marginBottom:20 }}>
          <button
            onClick={() => setLegendModal(true)}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'8px 14px', borderRadius:12, border:'1.5px solid #e8e8f0',
              cursor:'pointer', background:'#fff', color:'#6b7280',
              fontSize:12, fontWeight:600, fontFamily:'Inter',
              transition:'border-color 0.15s, color 0.15s', whiteSpace:'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#a5b4fc'; e.currentTarget.style.color='#4f46e5' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#e8e8f0'; e.currentTarget.style.color='#6b7280' }}
          >
            <Info size={13} />
            ¿Qué significa cada estado?
          </button>
        </div>
      )}

      {/* Grid de pólizas */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12, animation:'skpulse 1.5s ease-in-out infinite' }}>
          <style>{`@keyframes skpulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{ background:'#f5f7fb', borderRadius:20, overflow:'hidden' }}>
              {/* Logo area */}
              <div style={{ height:90, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:80, height:32, background:'#f0f1f3', borderRadius:8 }} />
              </div>
              {/* Info area */}
              <div style={{ padding:'11px 13px 13px', display:'flex', flexDirection:'column', gap:7 }}>
                <div style={{ background:'#f0f1f3', borderRadius:99, height:20, width:64 }} />
                <div style={{ background:'#f0f1f3', borderRadius:5, height:13, width:'80%' }} />
                <div style={{ background:'#f0f1f3', borderRadius:5, height:11, width:'50%' }} />
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                  <div style={{ background:'#f0f1f3', borderRadius:5, height:12, width:56 }} />
                  <div style={{ background:'#f0f1f3', borderRadius:5, height:10, width:36 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12 }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn:'1/-1', background:'#fff', borderRadius:22, border:'1px solid #f0f0f2', padding:'48px 24px',
                          display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
              <div style={{ width:56, height:56, borderRadius:20, background:'#f5f7fb',
                            display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                <Shield size={24} color="#d1d5db" />
              </div>
              <p style={{ margin:'0 0 6px', fontFamily:'Poppins', fontSize:15, fontWeight:600, color:'#374151' }}>
                Sin pólizas en esta categoría
              </p>
              <p style={{ margin:0, fontFamily:'Inter', fontSize:13, color:'#9ca3af', maxWidth:260, lineHeight:1.6 }}>
                Cuando envíes una cotización a emitir aparecerá aquí.
              </p>
            </div>
          ) : (
            filtered.map(item => <ItemCard key={`${item._tipo}-${item.id}`} item={item} />)
          )}
        </div>
      )}

      {modal && (
        <DetalleModal
          item={modal}
          token={getToken()}
          onClose={() => setModal(null)}
        />
      )}

      {/* Modal de leyenda de estados */}
      {legendModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:500,
                      display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
             onClick={() => setLegendModal(false)}>
          <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:420,
                        boxShadow:'0 24px 64px rgba(0,0,0,0.18)', overflow:'hidden' }}
               onClick={e => e.stopPropagation()}>

            {/* Cabecera */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                          padding:'18px 20px 14px', borderBottom:'1px solid #f3f4f6' }}>
              <div>
                <h3 style={{ margin:0, fontFamily:'Poppins', fontSize:15, fontWeight:700, color:'#111827' }}>
                  ¿Qué significa cada estado?
                </h3>
                <p style={{ margin:'3px 0 0', fontFamily:'Inter', fontSize:12, color:'#9ca3af' }}>
                  {tab === 'en_tramite' ? 'Etapa: En trámite' : tab === 'aprobada' ? 'Etapa: Aprobadas' : 'Etapa: No aprobado'}
                </p>
              </div>
              <button onClick={() => setLegendModal(false)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4,
                         display:'flex', alignItems:'center' }}>
                <X size={18} />
              </button>
            </div>

            {/* Estados */}
            {(tab === 'en_tramite' ? EN_TRAMITE_LEGEND : [
              tab === 'aprobada'
                ? { estado:'aprobada',      emoji:'✅', text: ESTADOS.aprobada.desc      }
                : { estado:'no_convertida', emoji:'❌', text: ESTADOS.no_convertida.desc },
            ]).map((s, i, arr) => {
              const E = ESTADOS[s.estado]
              return (
                <div key={s.estado}
                  style={{ padding:'16px 20px', borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <span style={{
                    display:'inline-block', marginBottom:8,
                    background: E.bg, color: E.color,
                    fontSize: 11, fontWeight: 700,
                    padding: '4px 12px', borderRadius: 99,
                    border: `1px solid ${E.color}22`,
                  }}>
                    {s.emoji} {E.label}
                  </span>
                  <p style={{ margin:0, fontFamily:'Inter', fontSize:13, color:'#4b5563', lineHeight:1.65 }}>
                    {s.text}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
