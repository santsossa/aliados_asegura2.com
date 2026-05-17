import { useState, useEffect, useRef } from 'react'
import { Car, X, Trash2, Send, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const fmt = n => n ? ('$' + Math.round(n).toLocaleString('es-CO')) : '—'
const fmtCV = n => n ? new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }).format(n) : null

// ── Tooltips de coberturas ────────────────────────────────────────────────────
const COVERAGE_TIPS = {
  // Responsabilidad Civil
  'responsabilidad civil extracontractual': 'Si en un accidente causas daños al carro de otra persona o la hieres, la aseguradora paga por ti. Ejemplo: chocas un carro en un semáforo — la aseguradora paga los daños del otro vehículo y los gastos médicos del conductor afectado.',
  'responsabilidad civil': 'Cubre los daños que le causes a terceros (personas o vehículos) en un accidente donde tú tengas culpa. Ejemplo: te pasas un semáforo en rojo y chocas otro carro — la aseguradora paga la reparación del otro vehículo y la atención médica si hay heridos.',
  'rc': 'Cubre los daños que le causes a terceros en accidentes. Ejemplo: si chocas a otra persona o le dañas su propiedad, la aseguradora responde económicamente por ti sin que tengas que pagar de tu bolsillo.',
  // Daños propios
  'todo riesgo': 'La cobertura más completa: protege tu carro contra cualquier daño, sin importar si el accidente fue culpa tuya. Ejemplo: raspas el carro en un poste estacionando, chocas en la autopista o una piedra te rompe el parabrisas — todo lo cubre la aseguradora.',
  'daños propios': 'Si chocas tu carro contra otro vehículo, un poste o cualquier objeto, la aseguradora paga la reparación de tu propio vehículo. Ejemplo: se te fue el pie del freno y chocaste contra una pared — la aseguradora cubre los daños de tu carro.',
  'colisión': 'Cubre los daños de tu vehículo cuando choca contra otro objeto o vehículo. Ejemplo: un carro te golpeó por detrás en un trancón — la aseguradora repara los daños de tu carro sin importar quién tuvo la culpa.',
  'daño': 'Cubre reparaciones de tu vehículo por daños físicos causados por choques, golpes o raspones. Ejemplo: alguien chocó tu carro en el parqueadero y se fue — la aseguradora paga la reparación.',
  // Pérdidas
  'pérdida parcial': 'Cuando el carro sufre daños que se pueden reparar (no queda destruido del todo). Ejemplo: un choque moderado abolló la puerta y el capó — la aseguradora paga el taller.',
  'pérdida total por accidente': 'Si el carro queda tan destruido en un accidente que el costo de reparación supera el 75% de su valor, la aseguradora te paga el valor comercial del vehículo. Ejemplo: en un accidente grave el carro quedó aplastado — te pagan el valor del carro.',
  'pérdida total': 'Si el carro queda inutilizable por accidente o robo, la aseguradora te paga su valor comercial. Ejemplo: el carro quedó destruido en un choque o fue robado y no apareció — recibes el dinero para comprarte otro.',
  'pérdida total por hurto': 'Si te roban el carro y después de 30 días no aparece, la aseguradora te paga su valor comercial. Ejemplo: te robaron el carro en el centro y no lo recuperaron — la aseguradora te da el dinero para comprar otro.',
  // Hurto
  'hurto parcial': 'Si te roban partes del carro (espejos, rines, batería, pantalla, etc.) sin llevarse el vehículo completo. Ejemplo: amaneciste y te habían robado los 4 rines y los espejos — la aseguradora te los repone.',
  'hurto': 'Si te roban el carro completo y no aparece en el plazo establecido. Ejemplo: dejaste el carro en la calle y cuando volviste ya no estaba — la aseguradora te paga su valor para que puedas reemplazarlo.',
  'robo': 'Cubre la pérdida del vehículo por robo. Si te lo robaron y no apareció, la aseguradora te paga el valor del carro para que puedas adquirir otro.',
  // Asistencia
  'asistencia en carretera': 'Si el carro se daña lejos de casa (llanta pinchada, daño mecánico, carro varado), la aseguradora envía ayuda al lugar donde estés. Ejemplo: en la vía a Medellín se te pinchó la llanta a las 11pm — llamas a la aseguradora y mandan asistencia.',
  'grúa': 'Si el carro no puede moverse por un accidente o daño mecánico, la aseguradora paga el transporte al taller. Ejemplo: el carro se apagó en la mitad de la vía — la grúa lo lleva al taller sin costo para ti.',
  'auxilio vial': 'Servicio de ayuda en carretera que incluye grúa, cambio de llanta, envío de combustible y asistencia básica mecánica. Ideal para emergencias en ruta.',
  'auto sustituto': 'Mientras tu carro está en el taller siendo reparado, la aseguradora te presta otro para no quedarte sin transporte. Ejemplo: el carro está 5 días en el taller — durante esos días la aseguradora te da un carro prestado.',
  'vehículo sustituto': 'La aseguradora te entrega un carro de reemplazo mientras el tuyo está en reparación. Muy útil si dependes del carro para trabajar o para tu día a día.',
  // Cristales y partes
  'cristales': 'Cubre la rotura del parabrisas, vidrios laterales o trasero, sin necesidad de que haya habido un choque. Ejemplo: una piedra que saltó de un camión rompió tu parabrisas — la aseguradora lo reemplaza.',
  'vidrios': 'Cubre la rotura de cualquier vidrio del carro (parabrisas, ventanas). Ejemplo: alguien rompió el vidrio de tu ventana para intentar robarte — la aseguradora paga el reemplazo.',
  // Fenómenos
  'incendio': 'Si el carro se incendia (por falla eléctrica, cortocircuito o cualquier causa), la aseguradora cubre los daños o te paga el valor si quedó destruido. Ejemplo: el carro se incendió por un problema eléctrico — la aseguradora responde.',
  'terremoto': 'Si un sismo, erupción volcánica o movimiento telúrico daña tu carro, la aseguradora lo cubre. Ejemplo: un temblor derrumbó una pared sobre el parqueadero donde estaba tu carro.',
  'fenómenos naturales': 'Cubre daños causados por eventos de la naturaleza: inundaciones, granizadas, vendavales, rayos, deslizamientos. Ejemplo: una granizada abolló todo el capó y el techo del carro.',
  'inundación': 'Si el carro se daña porque quedó bajo el agua durante una lluvia fuerte o desbordamiento de un río. Ejemplo: el carro quedó inundado por una tormenta y el motor se dañó — la aseguradora cubre la reparación.',
  'riesgos de la naturaleza': 'Protege el carro contra daños causados por fenómenos naturales como lluvias fuertes, granizo, vendavales, derrumbes o terremotos.',
  // Actos maliciosos
  'actos mal intencionados': 'Si alguien daña el carro a propósito: raya la pintura, rompe vidrios, le da un golpe sin robar. Ejemplo: amaneciste con el carro rayado de punta a punta — la aseguradora paga la latonería y pintura.',
  'vandalismo': 'Cubre daños intencionales al carro por parte de terceros desconocidos. Ejemplo: en una protesta dañaron varios carros del sector incluyendo el tuyo — la aseguradora lo repara.',
  // Servicios médicos y legales
  'llamada médica': 'Acceso 24/7 a orientación médica telefónica en caso de emergencia. Ejemplo: tu cliente tuvo un accidente en carretera a medianoche — puede llamar a un médico que le indica qué hacer mientras llega la ambulancia.',
  'asistencia médica': 'Servicio de atención médica de urgencia o consulta incluido en el seguro. Ante un accidente, la aseguradora coordina o cubre la atención médica inicial.',
  'orientación jurídica': 'Si tienes un accidente y necesitas asesoría legal (quién tiene la culpa, qué derechos tienes, cómo proceder), la aseguradora te conecta con un abogado. Ejemplo: el otro conductor te está culpando de un accidente que no fue tu culpa — un abogado te orienta.',
  'defensa jurídica': 'La aseguradora te proporciona representación legal si eres demandado por un accidente. Incluye abogado y cobertura de costos judiciales básicos.',
  'traslado de pasajeros': 'Si el carro se daña en otra ciudad y no pueden continuar el viaje, la aseguradora paga el regreso de los pasajeros a casa. Ejemplo: el carro se dañó viajando a Cartagena — la aseguradora paga los tiquetes de regreso.',
  // Transporte y movilidad
  'taxi': 'Mientras el carro está en el taller, la aseguradora cubre algunos viajes en taxi para que no quedes sin transporte. Muy útil durante los días de reparación.',
  'transporte': 'Cubre gastos de movilidad alternativa (taxi, bus, etc.) mientras el carro está en taller por un siniestro cubierto.',
  // Accesorios
  'accesorios': 'Cubre el robo o daño de elementos instalados en el carro: parlantes, pantallas, rines especiales, cámaras, etc. Ejemplo: te robaron la pantalla multimedia que instalaste — la aseguradora te la repone.',
  'equipos de sonido': 'Cubre el robo o daño del sistema de audio del carro (parlantes, amplificadores, pantalla de sonido). Ejemplo: te robaron los parlantes y el amplificador — la aseguradora los repone.',
  'llantas': 'Cubre el daño o robo de las llantas del vehículo. Ejemplo: apareciste con las llantas pinchadas intencionalmente o te las robaron.',
  // Otros comunes
  'responsabilidad civil contractual': 'Cubre daños a personas o propiedades que transportas en el vehículo como parte de un contrato de servicio. Aplica principalmente para vehículos de carga o transporte de mercancías.',
  'responsabilidad civil bienes': 'Cubre daños a objetos o propiedades de terceros causados por el vehículo. Ejemplo: el carro se soltó y chocó contra la vitrina de un local — la aseguradora paga los daños.',
  'gastos médicos': 'Cubre los gastos médicos del conductor y los ocupantes del vehículo en caso de accidente, sin importar quién tuvo la culpa. Ejemplo: sufriste un accidente y necesitas atención médica — la aseguradora cubre parte de los gastos.',
  'accidentes personales': 'Cubre lesiones o muerte del conductor y pasajeros en caso de accidente de tránsito. Proporciona una indemnización económica a los afectados o sus familias.',
  'muerte accidental': 'Si el conductor o un pasajero fallece en un accidente de tránsito, la aseguradora paga una indemnización a sus beneficiarios.',
  'incapacidad': 'Si el conductor queda incapacitado por un accidente de tránsito, la aseguradora paga una indemnización según el grado de incapacidad.',
}

function getCoverageTip(name = '') {
  const lower = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const keys = Object.keys(COVERAGE_TIPS)
  const exact = keys.find(k => {
    const kn = k.normalize('NFD').replace(/[̀-ͯ]/g, '')
    return lower === kn || lower.includes(kn) || kn.includes(lower)
  })
  if (exact) return COVERAGE_TIPS[exact]
  const words = lower.split(/\s+/).filter(w => w.length > 4)
  for (const w of words) {
    const match = keys.find(k => {
      const kn = k.normalize('NFD').replace(/[̀-ͯ]/g, '')
      return kn.includes(w) || w.includes(kn.split(' ')[0])
    })
    if (match) return COVERAGE_TIPS[match]
  }
  return null
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
  const [expandedPlan, setExpandedPlan] = useState(null) // accordion: índice del plan abierto
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
                        const planKey = `${tipo}-${i}`
                        const isSel = selectedPlan?.insuranceCode === q.insuranceCode && selectedPlan?.company === q.company
                        const isOpen = expandedPlan === planKey
                        const allCov = q.coverages?.length
                          ? q.coverages
                          : [...(q.main || []), ...(q.extras || [])]
                        return (
                          <div
                            key={i}
                            style={{
                              border: isSel ? '2px solid #2D2A7A' : '1.5px solid #e5e7eb',
                              borderRadius:12, overflow:'hidden',
                              background: isSel ? '#f5f4ff' : '#fff',
                              transition:'border-color 0.15s, background 0.15s',
                            }}
                          >
                            {/* Fila superior: logo + empresa + precio + selección */}
                            <div
                              onClick={() => puedeEmitir && emitPhase === 'select' ? setSelectedPlan(q) : undefined}
                              style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px',
                                       cursor: puedeEmitir && emitPhase === 'select' ? 'pointer' : 'default' }}
                            >
                              {q.logo && (
                                <img src={q.logo} alt={q.company}
                                  style={{ width:44, height:26, objectFit:'contain', flexShrink:0 }}
                                  onError={e => e.currentTarget.style.display='none'} />
                              )}
                              <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#111827', flex:1 }}>{q.company}</p>
                              <div style={{ textAlign:'right', flexShrink:0, marginRight:6 }}>
                                <p style={{ margin:0, fontSize:15, fontWeight:800, color:'#111827' }}>{fmt(q.price)}</p>
                                <p style={{ margin:0, fontSize:10, color:'#9ca3af' }}>anual</p>
                              </div>
                              {puedeEmitir && emitPhase === 'select' && (
                                <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${isSel?'#2D2A7A':'#d1d5db'}`,
                                              background: isSel ? '#2D2A7A' : '#fff', flexShrink:0 }} />
                              )}
                            </div>
                            {/* Botón para desplegar coberturas */}
                            {allCov.length > 0 && (
                              <button
                                onClick={() => setExpandedPlan(isOpen ? null : planKey)}
                                style={{ width:'100%', background: isOpen ? '#f0f0fd' : '#f9fafb',
                                         border:'none', borderTop:'1px solid #f3f4f6',
                                         padding:'7px 14px', fontSize:11, color: isOpen ? '#2D2A7A' : '#6b7280',
                                         fontWeight:600, cursor:'pointer', textAlign:'left',
                                         display:'flex', alignItems:'center', gap:4 }}>
                                {isOpen ? '▲ Ocultar' : '▼ Ver'} {allCov.length} cobertura{allCov.length !== 1 ? 's' : ''}
                              </button>
                            )}
                            {/* Coberturas expandidas — solo 1 abierto a la vez */}
                            {isOpen && (
                              <div style={{ padding:'10px 14px 12px', borderTop:'1px solid #f3f4f6',
                                            display:'flex', flexWrap:'wrap', gap:'6px 10px', background:'#fafafa' }}>
                                {allCov.map((cov, ci) => (
                                  <span key={ci} style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:11, color:'#374151' }}>
                                    <span style={{ color:'#16a34a', fontWeight:700 }}>✓</span>
                                    <CovTooltip name={cov} />
                                  </span>
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

// ── Drag & Drop file field ────────────────────────────────────────────────────
function FileField({ label, file, onChange, accept = '.pdf,.jpg,.jpeg,.png' }) {
  const [dragging, setDragging] = useState(false)
  const ref = useRef()

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) onChange(f)
  }

  const border = file ? '#2D2A7A' : dragging ? '#6366f1' : '#d1d5db'
  const bg     = file ? '#f5f4ff' : dragging ? '#eef2ff' : '#f9fafb'

  return (
    <div style={{ marginBottom:12 }}>
      <p style={{ margin:'0 0 6px', fontSize:12, fontWeight:600, color:'#374151' }}>{label}</p>
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => ref.current?.click()}
        style={{ border:`2px dashed ${border}`, borderRadius:10, padding:'14px 16px',
                 cursor:'pointer', background:bg, transition:'all 0.2s',
                 display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20, flexShrink:0 }}>
          {file ? (file.name.endsWith('.pdf') ? '📄' : '🖼️') : dragging ? '📂' : '📎'}
        </span>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:0, fontSize:12, fontWeight: file ? 600 : 400,
                      color: file ? '#2D2A7A' : dragging ? '#6366f1' : '#9ca3af',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {file ? file.name : dragging ? 'Suelta aquí' : 'Arrastra o toca para adjuntar'}
          </p>
          {!file && <p style={{ margin:'1px 0 0', fontSize:10, color:'#9ca3af' }}>PDF, JPG o PNG</p>}
        </div>
        {file && (
          <button type="button" onClick={e => { e.stopPropagation(); onChange(null) }}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:14, padding:0, flexShrink:0 }}>
            ✕
          </button>
        )}
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
