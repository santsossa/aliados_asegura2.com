import { useState, useEffect, useRef } from 'react'
import { Car, X, Trash2, Send, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const fmt = n => n ? ('$' + Math.round(n).toLocaleString('es-CO')) : '—'
const fmtCV = n => n ? new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }).format(n) : null

// ── Tooltips de coberturas ────────────────────────────────────────────────────
const COVERAGE_TIPS = {
  'responsabilidad civil extracontractual': 'Si en un accidente le causas daños al carro de otra persona o la hieres, la aseguradora paga por ti. Sin esto, tendrías que pagarlo de tu bolsillo.',
  'responsabilidad civil': 'Si chocas y le dañas el carro a alguien, o atropellas a una persona, la aseguradora responde económicamente por ti ante el afectado.',
  'todo riesgo': 'Si chocas, te rayan el carro o sufre cualquier daño, la aseguradora paga la reparación aunque el accidente haya sido culpa tuya.',
  'daños propios': 'Si chocas el carro contra otro vehículo o un poste, la aseguradora cubre el costo de reparación de tu propio vehículo.',
  'colisión': 'Si chocas el carro contra otro objeto o vehículo, la aseguradora paga la reparación, sin importar quién tuvo la culpa.',
  'pérdida parcial': 'Si el carro sufre daños que se pueden reparar (como un golpe o raspón), la aseguradora paga la reparación.',
  'pérdida total por accidente': 'Si el carro choca tan fuerte que no vale la pena repararlo, la aseguradora te paga el valor comercial del carro.',
  'pérdida total': 'Si el carro queda destruido o los daños superan el 75% de su valor, la aseguradora te paga el precio de mercado del vehículo.',
  'pérdida total por hurto': 'Si te roban el carro y después de 30 días no aparece, la aseguradora te paga el valor comercial del vehículo.',
  'hurto parcial': 'Si te roban partes del carro (espejos, rines, batería, etc.), la aseguradora cubre el reemplazo de esas piezas.',
  'hurto': 'Si te roban el carro completamente y no aparece, la aseguradora te paga su valor comercial.',
  'robo': 'Si te roban el carro, la aseguradora cubre el valor del vehículo si no es recuperado en cierto plazo.',
  'asistencia en carretera': 'Si el carro se daña lejos de casa, la aseguradora envía un técnico, grúa o combustible para ayudarte donde estés.',
  'grúa': 'Si el carro no puede moverse por un accidente o daño mecánico, la aseguradora paga el traslado al taller más cercano.',
  'auto sustituto': 'Mientras tu carro está en el taller, la aseguradora te presta otro vehículo para que no quedes sin transporte.',
  'cristales': 'Si se rompen el parabrisas o las ventanas del carro, la aseguradora paga su reemplazo aunque no haya habido un choque.',
  'incendio': 'Si el carro se incendia, ya sea por falla mecánica, cortocircuito u otro motivo, la aseguradora cubre los daños.',
  'terremoto': 'Si un sismo o erupción volcánica daña tu carro, la aseguradora lo cubre.',
  'fenómenos naturales': 'Si una inundación, vendaval, granizo o avalancha daña el carro, la aseguradora paga la reparación.',
  'inundación': 'Si el carro se daña porque quedó bajo el agua por una lluvia intensa o desbordamiento, la aseguradora lo cubre.',
  'actos mal intencionados': 'Si alguien raya el carro, le rompe vidrios o lo daña intencionalmente, la aseguradora cubre la reparación.',
  'vandalismo': 'Si desconocidos dañan el carro a propósito (pintura rayada, espejos rotos, etc.), la aseguradora paga la reparación.',
  'llamada médica': 'Si tienes una urgencia médica en carretera, puedes llamar 24/7 a un médico que te orienta sobre qué hacer o a dónde ir.',
  'orientación jurídica': 'Si tienes un accidente y necesitas asesoría legal, la aseguradora te conecta con un abogado para guiarte.',
  'traslado de pasajeros': 'Si el carro se daña lejos de la ciudad, la aseguradora paga el regreso de los pasajeros a su lugar de origen.',
  'taxi': 'Si el carro está en el taller, la aseguradora te cubre algunos viajes en taxi para que no quedes sin movilidad.',
  'accesorios': 'Si te roban o dañan elementos del carro como parlantes, rines o pantallas, la aseguradora los reemplaza.',
  'rc': 'Si en un accidente le causas daños a otra persona o a su vehículo, la aseguradora paga por ti.',
}

function getCoverageTip(name = '') {
  const lower = name.toLowerCase()
  const key = Object.keys(COVERAGE_TIPS).find(k => lower.includes(k))
  return key ? COVERAGE_TIPS[key] : null
}

function CovTooltip({ name }) {
  const [show, setShow] = useState(false)
  const tip = getCoverageTip(name) || 'Esta cobertura forma parte del plan seleccionado. Consulta a tu asesor de Asegura2 para más detalles sobre sus condiciones específicas.'
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, position:'relative' }}>
      <span style={{ fontSize:11, color:'#374151' }}>{name}</span>
      <span
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        style={{ width:13, height:13, borderRadius:'50%', background:'#e5e7eb', color:'#6b7280',
                 fontSize:8, fontWeight:800, display:'inline-flex', alignItems:'center',
                 justifyContent:'center', cursor:'help', flexShrink:0, lineHeight:1 }}>
        ?
      </span>
      {show && (
        <span style={{ position:'absolute', bottom:'calc(100% + 6px)', left:0, background:'#111827',
                       color:'#fff', fontSize:11, padding:'8px 11px', borderRadius:9, zIndex:300,
                       lineHeight:1.5, width:240, boxShadow:'0 4px 16px rgba(0,0,0,0.2)',
                       pointerEvents:'none', whiteSpace:'normal' }}>
          {tip}
        </span>
      )}
    </span>
  )
}

// ── Tooltip Full vs Básico ────────────────────────────────────────────────────
const PLAN_TIPS = {
  full: 'El plan completo incluye cobertura TODO RIESGO: protege tu carro contra daños propios (choques, raspones, rayones, volcamiento), pérdida total, hurto, cristales, fenómenos naturales y más. También cubre responsabilidad civil ante terceros y servicios adicionales como grúa y auto sustituto. Es la protección más amplia que puedes tener.',
  basico: 'El plan básico cubre lo esencial: responsabilidad civil ante terceros (si le causas daño a otra persona o vehículo) y pérdida total (si el carro queda destruido o lo roban y no aparece). No cubre daños propios por choques o raspones. Es ideal si buscas un costo menor con lo mínimo indispensable.',
}

function PlanTipoTooltip({ tipo }) {
  const [show, setShow] = useState(false)
  const tip = PLAN_TIPS[tipo]
  const label = tipo === 'full' ? 'Plan Completo (Full)' : 'Plan Básico'
  const color = tipo === 'full' ? '#7c3aed' : '#2563eb'
  const bg = tipo === 'full' ? '#ede9fe' : '#dbeafe'
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, position:'relative' }}>
      <span style={{ background:bg, color, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99 }}>
        {label}
      </span>
      <span
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        style={{ width:15, height:15, borderRadius:'50%', background:'#e5e7eb', color:'#6b7280',
                 fontSize:9, fontWeight:800, display:'inline-flex', alignItems:'center',
                 justifyContent:'center', cursor:'help', flexShrink:0 }}>
        ?
      </span>
      {show && (
        <span style={{ position:'absolute', bottom:'calc(100% + 8px)', left:0, background:'#111827',
                       color:'#fff', fontSize:11, padding:'10px 13px', borderRadius:10, zIndex:300,
                       lineHeight:1.6, width:260, boxShadow:'0 4px 20px rgba(0,0,0,0.25)',
                       pointerEvents:'none', whiteSpace:'normal' }}>
          {tip}
        </span>
      )}
    </span>
  )
}

const ESTADO_BADGE = {
  enviada: { bg:'#dcfce7', color:'#16a34a', label:'Enviada a emitir'    },
  default: { bg:'#f3f4f6', color:'#374151', label:'No enviada a emitir' },
}
function getBadge(estado) {
  return estado === 'enviada' ? ESTADO_BADGE.enviada : ESTADO_BADGE.default
}

// ── Modal de detalle ──────────────────────────────────────────────────────────
function CotizacionModal({ cotizacion, token, user, onClose, onDeleted, onEmitida }) {
  const datos = (() => {
    const raw = cotizacion.datos_cotizacion
    if (!raw) return {}
    if (typeof raw === 'object') return raw
    try { return JSON.parse(raw) } catch { return {} }
  })()
  const quotes = (datos.quotes || []).sort((a, b) => a.price - b.price)
  const formFull = datos.form_full || {}

  const createdAt = new Date(cotizacion.created_at)
  const horasTranscurridas = (Date.now() - createdAt.getTime()) / 3600000
  const within24h = horasTranscurridas < 24
  const noEnviada = cotizacion.estado !== 'enviada'
  const puedeEmitir = noEnviada && within24h

  const [emitPhase, setEmitPhase] = useState('view') // 'view' | 'select' | 'docs' | 'done'
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [cedulaFile, setCedulaFile] = useState(null)
  const [tarjetaFile, setTarjetaFile] = useState(null)
  const [sending, setSending] = useState(false)
  const [sendErr, setSendErr] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fechaStr = `${createdAt.getDate()} ${MESES[createdAt.getMonth()]} ${createdAt.getFullYear()}`
  const nombre = cotizacion.cliente_nombre || `${formFull.nombre || ''} ${formFull.apellido || ''}`.trim() || 'Sin nombre'
  const cedula = cotizacion.cliente_cedula || formFull.numDoc || null
  const tipoCedula = cotizacion.cliente_tipo_doc || formFull.tipoDoc || null
  const placa = cotizacion.placa || null

  // ── Eliminar ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    setDeleting(true)
    try {
      const r = await fetch(`${API}/api/cotizaciones/${cotizacion.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (r.ok) { onDeleted(cotizacion.id); onClose() }
    } catch {}
    finally { setDeleting(false) }
  }

  // ── Emitir ──────────────────────────────────────────────────────────────────
  async function handleEmitir(e) {
    e.preventDefault()
    if (!selectedPlan || !cedulaFile || !tarjetaFile) {
      setSendErr('Debes seleccionar un plan y adjuntar ambos documentos.')
      return
    }
    setSending(true); setSendErr('')
    try {
      const f = formFull
      const diaNac  = String(f.diaNac  || '1').padStart(2,'0')
      const mesNac  = String(f.mesNac  || '1').padStart(2,'0')
      const anioNac = f.anioNac || '1990'
      const birthDate = `${anioNac}-${mesNac}-${diaNac}`

      const fd = new FormData()
      fd.append('formData', JSON.stringify({
        documentTypeId: f.tipoDoc || 'CC',
        identification: f.numDoc || cedula || '',
        firstName: f.nombre || nombre.split(' ')[0] || '',
        lastName:  f.apellido || nombre.split(' ').slice(1).join(' ') || '',
        birthDate,
        plate: placa || '',
        municipalityId: f.ciudad || '',
        mobileNumber: f.celular || cotizacion.cliente_telefono || '',
        genderId: f.gender === 'F' ? 2 : 1,
        gender: f.gender || 'M',
        email: f.correo || cotizacion.cliente_correo || '',
        city: f.cityName || '',
        vehicleModel: cotizacion.anio || '',
        commercialValue: cotizacion.comercial_value || 0,
      }))
      fd.append('poliza', JSON.stringify({
        insuranceCode: selectedPlan.insuranceCode || selectedPlan.carrierId,
        company: selectedPlan.company,
        price: selectedPlan.price,
        productFull: selectedPlan.productFull,
        main: selectedPlan.main || [],
      }))
      fd.append('aliado_nombre', `${user?.nombre||''} ${user?.apellido||''}`.trim() || user?.email || '')
      fd.append('cotizacion_id', String(cotizacion.id))
      fd.append('cedula_titular', cedulaFile)
      fd.append('tarjeta_propiedad', tarjetaFile)

      const r = await fetch(`${API}/api/cotizar/emitir`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
        credentials: 'include',
      })
      const data = await r.json()
      if (!r.ok) { setSendErr(data.message || 'Error al enviar.'); return }
      setEmitPhase('done')
      onEmitida(cotizacion.id)
    } catch { setSendErr('No se pudo conectar con el servidor.') }
    finally { setSending(false) }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000,
               display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onClose}
    >
      <div
        style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:560,
                 maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'20px 24px 16px', borderBottom:'1px solid #f3f4f6' }}>
          <div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:'#111827' }}>Detalle de cotización</h2>
            <p style={{ margin:'2px 0 0', fontSize:12, color:'#9ca3af' }}>{fechaStr}</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding:'20px 24px' }}>

          {/* Datos del cliente */}
          <div style={{ background:'#f9fafb', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
            <p style={{ margin:'0 0 4px', fontSize:13, fontWeight:700, color:'#111827' }}>{nombre}</p>
            <p style={{ margin:0, fontSize:12, color:'#6b7280' }}>
              {tipoCedula && cedula ? `${tipoCedula} ${cedula}` : cedula || '—'}
              {placa ? ` · ${placa}` : ''}
            </p>
            {/* Valor asegurado — siempre visible */}
            <p style={{ margin:'6px 0 0', fontSize:12, color:'#374151' }}>
              <span style={{ color:'#9ca3af' }}>Valor asegurado: </span>
              <strong>{fmtCV(cotizacion.comercial_value || datos.commercial_value) || 'No registrado'}</strong>
            </p>
          </div>

          {/* Estado y tiempo */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            {(() => { const b = getBadge(cotizacion.estado); return (
              <span style={{ background:b.bg, color:b.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:99 }}>
                {b.label}
              </span>
            )})()}
            {noEnviada && (
              <span style={{ fontSize:11, color: within24h ? '#16a34a' : '#dc2626', display:'flex', alignItems:'center', gap:3 }}>
                <Clock size={11} />
                {within24h
                  ? `Válida · quedan ${Math.max(0, Math.floor(24 - horasTranscurridas))}h`
                  : 'Vencida (más de 24 h)'}
              </span>
            )}
          </div>

          {/* ── Planes ── */}
          {emitPhase === 'view' || emitPhase === 'select' ? (
            <>
              <h3 style={{ margin:'0 0 10px', fontSize:13, fontWeight:700, color:'#374151' }}>
                Planes cotizados {quotes.length > 0 ? `(${quotes.length})` : ''}
              </h3>
              {quotes.length === 0 ? (
                <div style={{ textAlign:'center', padding:'24px 0', color:'#9ca3af', fontSize:13 }}>
                  Sin planes disponibles — esta cotización fue guardada antes de la última actualización
                </div>
              ) : (() => {
                const fullPlans  = quotes.filter(q => q.productFull)
                const basicPlans = quotes.filter(q => !q.productFull)
                const renderGroup = (plans, tipo) => plans.length === 0 ? null : (
                  <div key={tipo} style={{ marginBottom:14 }}>
                    <div style={{ marginBottom:8 }}>
                      <PlanTipoTooltip tipo={tipo} />
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {plans.map((q, i) => {
                        const isSel = selectedPlan?.insuranceCode === q.insuranceCode && selectedPlan?.company === q.company
                        return (
                          <div
                            key={i}
                            onClick={() => puedeEmitir && emitPhase === 'select' ? setSelectedPlan(q) : undefined}
                            style={{
                              border: isSel ? '2px solid #2D2A7A' : '1.5px solid #e5e7eb',
                              borderRadius:12, padding:'12px 14px',
                              cursor: puedeEmitir && emitPhase === 'select' ? 'pointer' : 'default',
                              background: isSel ? '#f5f4ff' : '#fff',
                              transition:'border-color 0.15s, background 0.15s',
                            }}
                          >
                            {/* Fila superior: logo + empresa + precio */}
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: q.main?.length > 0 ? 8 : 0 }}>
                              {q.logo && (
                                <img src={q.logo} alt={q.company}
                                  style={{ width:44, height:26, objectFit:'contain', flexShrink:0 }}
                                  onError={e => e.currentTarget.style.display='none'} />
                              )}
                              <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#111827', flex:1 }}>{q.company}</p>
                              <div style={{ textAlign:'right', flexShrink:0 }}>
                                <p style={{ margin:0, fontSize:15, fontWeight:800, color:'#111827' }}>{fmt(q.price)}</p>
                                <p style={{ margin:0, fontSize:10, color:'#9ca3af' }}>anual</p>
                              </div>
                              {puedeEmitir && emitPhase === 'select' && (
                                <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${isSel?'#2D2A7A':'#d1d5db'}`,
                                              background: isSel ? '#2D2A7A' : '#fff', flexShrink:0 }} />
                              )}
                            </div>
                            {/* Coberturas con tooltips */}
                            {q.main?.length > 0 && (
                              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 8px', paddingTop:4,
                                            borderTop:'1px solid #f3f4f6' }}>
                                {q.main.map((cov, ci) => (
                                  <CovTooltip key={ci} name={cov} />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
                return (
                  <div style={{ marginBottom:16 }}>
                    {renderGroup(fullPlans, 'full')}
                    {renderGroup(basicPlans, 'basico')}
                  </div>
                )
              })()}

              {/* Alerta: ya enviada */}
              {!noEnviada && (
                <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'12px 14px',
                              display:'flex', gap:8, alignItems:'center', marginBottom:16 }}>
                  <span style={{ fontSize:18 }}>✅</span>
                  <p style={{ margin:0, fontSize:12, color:'#166534', fontWeight:600, lineHeight:1.5 }}>
                    Ya enviaste esta cotización a emitir. El equipo de Asegura2 está gestionándola.
                  </p>
                </div>
              )}

              {/* Alerta 24h vencida */}
              {noEnviada && !within24h && (
                <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:10, padding:'12px 14px',
                              display:'flex', gap:8, alignItems:'flex-start', marginBottom:16 }}>
                  <AlertCircle size={16} color="#ea580c" style={{ flexShrink:0, marginTop:1 }} />
                  <p style={{ margin:0, fontSize:12, color:'#9a3412', lineHeight:1.5 }}>
                    <strong>Han pasado más de 24 horas</strong> desde que realizaste esta cotización.
                    Los precios ya no son válidos. Vuelve a cotizar para obtener precios actualizados.
                  </p>
                </div>
              )}

              {/* Botones de acción */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {puedeEmitir && emitPhase === 'view' && quotes.length > 0 && (
                  <button
                    onClick={() => setEmitPhase('select')}
                    style={{ flex:1, background:'#2D2A7A', color:'#fff', border:'none', borderRadius:10,
                             padding:'10px 16px', fontSize:13, fontWeight:700, cursor:'pointer',
                             display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    <Send size={14} /> Enviar a emitir
                  </button>
                )}
                {puedeEmitir && emitPhase === 'select' && (
                  <button
                    onClick={() => { if (selectedPlan) setEmitPhase('docs'); else setSendErr('Selecciona un plan primero.') }}
                    disabled={!selectedPlan}
                    style={{ flex:1, background: selectedPlan?'#2D2A7A':'#9ca3af', color:'#fff', border:'none',
                             borderRadius:10, padding:'10px 16px', fontSize:13, fontWeight:700,
                             cursor: selectedPlan?'pointer':'not-allowed',
                             display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    Continuar con {selectedPlan?.company || 'plan seleccionado'} →
                  </button>
                )}
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    style={{ background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:10,
                             padding:'10px 14px', fontSize:13, fontWeight:700, cursor:'pointer',
                             display:'flex', alignItems:'center', gap:6 }}>
                    <Trash2 size={14} /> Eliminar
                  </button>
                ) : (
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <span style={{ fontSize:12, color:'#374151' }}>¿Confirmar?</span>
                    <button onClick={handleDelete} disabled={deleting}
                      style={{ background:'#dc2626', color:'#fff', border:'none', borderRadius:8,
                               padding:'7px 12px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                      {deleting ? '...' : 'Sí, eliminar'}
                    </button>
                    <button onClick={() => setConfirmDelete(false)}
                      style={{ background:'#f3f4f6', color:'#374151', border:'none', borderRadius:8,
                               padding:'7px 12px', fontSize:12, cursor:'pointer' }}>
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
              {sendErr && <p style={{ margin:'8px 0 0', fontSize:12, color:'#dc2626' }}>{sendErr}</p>}
            </>
          ) : emitPhase === 'docs' ? (
            /* ── Subir documentos ── */
            <form onSubmit={handleEmitir}>
              <div style={{ background:'#f0f4ff', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
                <p style={{ margin:0, fontSize:12, color:'#374151' }}>
                  Plan seleccionado: <strong>{selectedPlan.company}</strong> — {fmt(selectedPlan.price)}/año
                </p>
              </div>
              <h3 style={{ margin:'0 0 12px', fontSize:13, fontWeight:700, color:'#374151' }}>Documentos requeridos</h3>
              <FileField
                label="Cédula del titular (PDF)"
                file={cedulaFile}
                onChange={setCedulaFile}
                accept=".pdf,image/*"
              />
              <FileField
                label="Tarjeta de propiedad (PDF)"
                file={tarjetaFile}
                onChange={setTarjetaFile}
                accept=".pdf,image/*"
              />
              {sendErr && <p style={{ fontSize:12, color:'#dc2626', marginBottom:8 }}>{sendErr}</p>}
              <div style={{ display:'flex', gap:8, marginTop:4 }}>
                <button type="button" onClick={() => { setEmitPhase('select'); setSendErr('') }}
                  style={{ background:'#f3f4f6', color:'#374151', border:'none', borderRadius:10,
                           padding:'10px 16px', fontSize:13, cursor:'pointer' }}>
                  ← Volver
                </button>
                <button type="submit" disabled={sending || !cedulaFile || !tarjetaFile}
                  style={{ flex:1, background: (!cedulaFile||!tarjetaFile||sending)?'#9ca3af':'#2D2A7A',
                           color:'#fff', border:'none', borderRadius:10, padding:'10px 16px',
                           fontSize:13, fontWeight:700, cursor: (!cedulaFile||!tarjetaFile||sending)?'not-allowed':'pointer' }}>
                  {sending ? 'Enviando...' : 'Enviar a emitir'}
                </button>
              </div>
            </form>
          ) : (
            /* ── Hecho ── */
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
              <h3 style={{ margin:'0 0 8px', fontSize:16, fontWeight:800, color:'#111827' }}>¡Enviada a emitir!</h3>
              <p style={{ margin:'0 0 20px', fontSize:13, color:'#6b7280' }}>
                El equipo de Asegura2 se pondrá en contacto con el cliente.
              </p>
              <button onClick={onClose}
                style={{ background:'#2D2A7A', color:'#fff', border:'none', borderRadius:10,
                         padding:'10px 24px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── File upload field ─────────────────────────────────────────────────────────
function FileField({ label, file, onChange, accept }) {
  const ref = useRef()
  return (
    <div style={{ marginBottom:12 }}>
      <p style={{ margin:'0 0 6px', fontSize:12, fontWeight:600, color:'#374151' }}>{label}</p>
      <div
        onClick={() => ref.current?.click()}
        style={{
          border: `2px dashed ${file ? '#2D2A7A' : '#d1d5db'}`,
          borderRadius:10, padding:'12px 16px', cursor:'pointer',
          background: file ? '#f5f4ff' : '#f9fafb',
          display:'flex', alignItems:'center', gap:10,
          transition:'border-color 0.15s, background 0.15s',
        }}>
        <span style={{ fontSize:20 }}>{file ? '📄' : '📎'}</span>
        <span style={{ fontSize:12, color: file ? '#2D2A7A' : '#9ca3af', fontWeight: file ? 600 : 400 }}>
          {file ? file.name : 'Toca para seleccionar archivo'}
        </span>
      </div>
      <input ref={ref} type="file" accept={accept} style={{ display:'none' }}
        onChange={e => onChange(e.target.files?.[0] || null)} />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Cotizaciones() {
  const { getToken, user } = useAuth()
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalCot, setModalCot] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/aliados/me/cotizaciones`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      credentials: 'include',
    })
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setCotizaciones(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleDeleted(id) {
    setCotizaciones(prev => prev.filter(c => c.id !== id))
  }

  function handleEmitida(id) {
    setCotizaciones(prev => prev.map(c => c.id === id ? { ...c, estado: 'enviada' } : c))
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
        <p className="text-gray-500 text-sm mt-1">Todas las cotizaciones que has realizado. Toca una para ver detalle.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}
        </div>
      ) : cotizaciones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <Car size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium text-sm">Sin cotizaciones aún</p>
          <p className="text-gray-300 text-xs mt-1">Inicia tu primera cotización desde el menú lateral</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cotizaciones.map(c => {
            const raw = c.datos_cotizacion
            let datos = {}
            if (raw) { if (typeof raw === 'object') datos = raw; else try { datos = JSON.parse(raw) } catch {} }
            const badge = getBadge(c.estado)
            const fecha = new Date(c.created_at)
            const fechaStr = `${fecha.getDate()} ${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`
            const nPlanes = (datos.quotes || []).length || ((datos.planes_full || 0) + (datos.planes_basico || 0))
            const within24h = (Date.now() - fecha.getTime()) / 3600000 < 24
            const noEnviada = c.estado !== 'enviada'

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Info izquierda */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Car size={18} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {c.cliente_nombre || 'Cliente sin nombre'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.cliente_tipo_doc && c.cliente_cedula
                          ? `${c.cliente_tipo_doc} ${c.cliente_cedula} · `
                          : ''}
                        {c.placa || 'Sin placa'}
                        {' · '}{fechaStr}
                      </p>
                    </div>
                  </div>

                  {/* Derecha: estado + ver más */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      <span style={{ background: badge.bg, color: badge.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, whiteSpace:'nowrap' }}>
                        {badge.label}
                      </span>
                      {noEnviada && !within24h && (
                        <span style={{ fontSize:10, color:'#ea580c', fontWeight:600 }}>Vencida</span>
                      )}
                    </div>
                    <button
                      onClick={() => setModalCot(c)}
                      style={{ display:'flex', alignItems:'center', gap:4, background:'#f3f4f6', border:'none',
                               borderRadius:99, padding:'6px 12px', cursor:'pointer', color:'#374151',
                               fontSize:12, fontWeight:600, whiteSpace:'nowrap',
                               transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='#e5e7eb'}
                      onMouseLeave={e => e.currentTarget.style.background='#f3f4f6'}
                    >
                      Ver más
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalCot && (
        <CotizacionModal
          cotizacion={modalCot}
          token={getToken()}
          user={user}
          onClose={() => setModalCot(null)}
          onDeleted={handleDeleted}
          onEmitida={handleEmitida}
        />
      )}
    </div>
  )
}
