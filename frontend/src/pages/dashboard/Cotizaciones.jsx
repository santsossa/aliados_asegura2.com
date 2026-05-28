import { useState, useEffect, useRef } from 'react'
import { Car, X, Send, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const fmt = n => n ? ('$' + Math.round(n).toLocaleString('es-CO')) : '—'
const fmtCV = n => n ? new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }).format(n) : null

// ── Tooltips de coberturas ────────────────────────────────────────────────────
// Importado desde Cotizar.jsx — diccionario unificado de coberturas colombianas
const COVERAGE_TIPS = {
  'responsabilidad civil extracontractual': 'Si en un accidente le causas daños al carro de otra persona o la hieres, la aseguradora paga por ti. Ejemplo: chocas en un semáforo y le rompes el parabrisas al otro conductor — la aseguradora lo repara y cubre su atención médica si la necesita.',
  'responsabilidad civil': 'Cubre los daños económicos que le causes a terceros (personas, carros, bienes) en un accidente. Ejemplo: pierdes el control en la vía y dañas un local comercial — la aseguradora paga los daños a los dueños del local.',
  'rc extracontractual': 'Si en un accidente causas daños a personas o propiedades ajenas, la aseguradora responde económicamente por ti ante los afectados.',
  'rc daños a terceros': 'Cubre lo que tengas que pagarle a otras personas por daños que hayas causado con tu vehículo, ya sea a sus carros, a su propiedad o a ellos mismos.',
  'rc bienes': 'Si con el vehículo dañas la propiedad de otra persona (un muro, una reja, un local), la aseguradora cubre el valor de los daños.',
  'rc personas': 'Si en un accidente hieres a alguien, la aseguradora paga los gastos médicos, hospitalización y demás costos relacionados con su lesión.',
  'todo riesgo': 'La protección más completa: cubre cualquier daño a tu carro sin importar si el accidente fue culpa tuya. Ejemplo: raspas el carro al parquear, te chocas en la autopista, o te cae un árbol encima — todo cubierto.',
  'daños propios': 'Si tu carro sufre daños por un choque, golpe o accidente en el que tengas culpa, la aseguradora paga la reparación. Ejemplo: se te fue el pie del freno y golpeaste una columna — la aseguradora cubre el taller.',
  'colisión': 'Cubre los daños de tu vehículo cuando impacta contra otro objeto o vehículo, sin importar quién tuvo la culpa. Ejemplo: un bus te chocó por detrás en un trancón — tu aseguradora repara tu carro mientras se resuelve quién paga.',
  'pérdida parcial': 'Cuando el carro sufre daños que se pueden reparar (no queda destruido del todo). Ejemplo: un accidente moderado abolló la puerta y el guardafango — la aseguradora paga el taller de latonería.',
  'daño': 'Cubre reparaciones por daños físicos al vehículo causados por choques, golpes o impactos. Ejemplo: alguien te golpeó en el parqueadero y se fue — la aseguradora cubre la reparación de los daños.',
  'pérdida total por accidente': 'Si el carro queda tan destruido en un choque que cuesta más repararlo que reemplazarlo (más del 75% de su valor), la aseguradora te paga su valor comercial para que puedas comprar otro.',
  'pérdida total por hurto': 'Si te roban el carro y transcurridos 30 días no aparece, la aseguradora te paga el valor comercial del vehículo para que puedas reemplazarlo.',
  'pérdida total': 'Si el carro queda completamente destruido o es robado sin aparecer, la aseguradora te paga su valor de mercado. No te quedas sin nada.',
  'hurto parcial': 'Si te roban partes del carro sin llevárselo completo (espejos, rines, batería, luces, catalizador, etc.), la aseguradora cubre el reemplazo de esas partes.',
  'hurto': 'Si te roban el carro completo y no aparece en el tiempo estipulado, la aseguradora te paga su valor comercial para que puedas comprar otro.',
  'robo': 'Cobertura contra robo del vehículo. Si te lo robaron y no fue recuperado, la aseguradora te indemniza con el valor comercial del carro.',
  'asistencia en carretera': 'Si el carro se daña en la vía y no puedes seguir el viaje, la aseguradora te manda ayuda donde estés: grúa, mecánico, cambio de llanta o combustible. Ejemplo: te pinchaste una llanta a las 11 pm en la vía a Bogotá — un técnico va hasta donde estás.',
  'auxilio en carretera': 'Si te quedas varado en la carretera por llanta pinchada, batería descargada o falta de combustible, la aseguradora envía asistencia al lugar donde estés.',
  'asistencia vial': 'Servicio de ayuda en carretera que incluye grúa, cambio de llanta, carga de batería y envío de gasolina. Ideal para emergencias en ruta.',
  'asistencia': 'Servicio de apoyo ante emergencias del vehículo en la vía: grúa, mecánico, cambio de llanta, batería. Te ayudan donde estés.',
  'grúa': 'Si el carro no puede moverse (por accidente o daño mecánico), la aseguradora paga el transporte hasta el taller más cercano. No tienes que buscar ni pagar la grúa.',
  'auxilio': 'Servicio de asistencia ante emergencias del vehículo. Incluye ayuda mecánica básica, cambio de llanta y remolque si es necesario.',
  'vehículo de reemplazo': 'Si el carro está en el taller por un siniestro cubierto, la aseguradora te entrega otro vehículo para que no quedes sin transporte durante los días de reparación.',
  'auto sustituto': 'Mientras el carro está en reparación por un siniestro, la aseguradora te presta un vehículo sustituto. Ejemplo: tu carro tarda 5 días en el taller — la aseguradora te da un carro prestado esos días.',
  'carro de reemplazo': 'La aseguradora te facilita un vehículo de reemplazo mientras el tuyo está siendo reparado por un siniestro cubierto por la póliza.',
  'renta diaria': 'Si el carro está en el taller por un accidente cubierto, la aseguradora te da un dinero diario para que puedas pagar transporte mientras se repara.',
  'cristales': 'Si el parabrisas, las ventanas laterales o el vidrio trasero se rompen (por una piedra, un impacto u otro motivo), la aseguradora paga el reemplazo. No necesitas que haya habido un choque.',
  'vidrios': 'Cubre la rotura del parabrisas y ventanas del carro. Ejemplo: una piedra que saltó de un camión te rompió el parabrisas — la aseguradora lo reemplaza.',
  'gastos médicos': 'Si el conductor o los pasajeros salen heridos en un accidente, la aseguradora ayuda a cubrir los costos de atención médica, hospitalización y tratamiento.',
  'accidentes personales': 'Protege económicamente al conductor y los pasajeros ante lesiones en un accidente de tránsito. Cubre gastos médicos, incapacidad temporal o permanente y muerte accidental.',
  'muerte accidental': 'Si el conductor o un pasajero fallece a causa de un accidente de tránsito, la aseguradora paga una suma de dinero a sus beneficiarios (familia).',
  'muerte e incapacidad': 'Cubre tanto el fallecimiento como las lesiones que generen incapacidad permanente del conductor o pasajeros en un accidente de tránsito.',
  'incapacidad permanente': 'Si como resultado de un accidente quedas con una limitación física permanente, la aseguradora te paga una compensación económica según el grado de incapacidad.',
  'invalidez': 'Si por un accidente de tránsito quedas con una discapacidad permanente, la aseguradora te paga una indemnización.',
  'conductor elegido': 'Servicio donde la aseguradora te manda un conductor profesional a donde estés para que maneje tu carro hasta donde necesitas ir. Ideal si tomaste licor, estás cansado o simplemente no quieres manejar. Es como un chofer temporal en tu propio carro.',
  'conductor': 'Servicio de conductor a domicilio: un profesional va hasta donde estás y maneja tu carro hasta tu destino. Muy útil si saliste a un evento y no quieres manejar de regreso.',
  'incendio': 'Si el carro se incendia (por falla eléctrica, cortocircuito o cualquier otra causa), la aseguradora cubre los daños o te paga el valor del vehículo si quedó destruido.',
  'terremoto': 'Si un sismo, temblor o erupción volcánica daña tu carro, la aseguradora cubre los daños aunque no hayas tenido ninguna culpa.',
  'fenómenos naturales': 'Cubre daños causados por eventos naturales: granizo que abolló el capó, una inundación que dañó el motor, un vendaval que tiró un árbol sobre el carro, etc.',
  'fenomenos de la naturaleza': 'Protege el vehículo ante daños causados por lluvias, granizadas, vendavales, terremotos, derrumbes o avalanchas.',
  'inundación': 'Si el carro se inunda por lluvias fuertes o desbordamiento de un río o canal, la aseguradora cubre los daños al motor y partes eléctricas.',
  'riesgos de la naturaleza': 'Cobertura para daños causados por fenómenos climáticos o naturales que afecten el vehículo: granizo, viento, inundaciones, rayos, sismos.',
  'riesgo de la naturaleza': 'Protege el carro contra daños ocasionados por eventos naturales como granizo, vendavales, inundaciones o terremotos.',
  'actos mal intencionados': 'Si alguien daña el carro a propósito (rayan la pintura, rompen un vidrio, le dan golpes sin robar), la aseguradora cubre la reparación.',
  'vandalismo': 'Cubre daños intencionales al carro hechos por terceros: pintura rayada, espejos rotos, llantas ponchadas adrede. Ejemplo: en una manifestación dañaron tu carro.',
  'actos de terceros': 'Si alguien daña tu vehículo intencionalmente sin robártelo, la aseguradora cubre los costos de reparación.',
  'llamada médica': 'Acceso a orientación médica telefónica las 24 horas del día. Si tienes una emergencia de salud en la vía, llamas y un médico te indica qué hacer mientras llega ayuda.',
  'orientación jurídica': 'Si tienes un accidente y no sabes qué hacer legalmente (quién es culpable, qué derechos tienes, cómo proceder), la aseguradora te conecta con un abogado que te asesora.',
  'defensa jurídica': 'La aseguradora te proporciona representación legal si eres demandado por un accidente de tránsito.',
  'asesoría jurídica': 'Asesoría legal ante accidentes de tránsito: un abogado te explica tus derechos y cómo actuar si te demandan o necesitas demandar.',
  'traslado de pasajeros': 'Si el carro se daña lejos de tu ciudad y no pueden continuar el viaje, la aseguradora paga los tiquetes de bus o avión para que los pasajeros regresen a casa.',
  'taxi': 'Si el carro está en el taller varios días por un siniestro, la aseguradora cubre algunos viajes en taxi para que no te quedes sin movilidad.',
  'estadía': 'Si el carro se daña en otra ciudad y no puedes regresar ese día, la aseguradora puede pagar el hospedaje mientras se repara o remolca el vehículo.',
  'llave de emergencia': 'Si pierdes las llaves del carro o te quedas encerrado afuera, la aseguradora envía un cerrajero para abrirlo o conseguir una llave de repuesto.',
  'cerrajería': 'Si pierdes la llave del carro o se queda dentro, la aseguradora te manda un experto que lo abre sin dañarlo.',
  'combustible': 'Si te quedas sin gasolina en la vía, la aseguradora te envía combustible al lugar donde estás para que puedas llegar al próximo puesto de gasolina.',
  'batería': 'Si la batería del carro se descarga y no puede arrancar, la aseguradora te manda asistencia para cargarla o reemplazarla.',
  'accesorios': 'Cubre el robo o daño de accesorios instalados en el carro que no son de fábrica: pantallas multimedia, parlantes, rines especiales, cámaras de reversa, etc.',
  'accesorios instalados': 'Si te roban o dañan elementos que instalaste en el carro (pantalla, parlantes, cámara, rines), la aseguradora los repone según el valor asegurado.',
  'equipos de sonido': 'Cubre el robo o daño del sistema de audio del carro (radio, amplificador, parlantes, subwoofer). Ejemplo: te rompieron el vidrio y robaron el equipo de sonido — la aseguradora lo repone.',
  'rc': 'Responsabilidad Civil: si en un accidente le causas daños a otra persona o su vehículo, la aseguradora paga por ti para que no tengas que hacerlo de tu bolsillo.',
  'sarlaft': 'Proceso legal requerido en Colombia para verificar que el titular del seguro no está en listas de control (lavado de activos). Es un trámite regulatorio obligatorio, no una cobertura adicional.',
  'checkup': 'Revisión técnica preventiva del vehículo incluida en la póliza. Un mecánico revisa el estado general del carro para detectar fallas antes de que se conviertan en problemas mayores.',
  'check up': 'Revisión preventiva del vehículo: un técnico hace una inspección general del carro para asegurarse de que todo funciona bien y prevenir averías.',
  'mecánico': 'Si el carro tiene un problema mecánico en la vía, la aseguradora envía un mecánico al lugar donde estás para diagnosticar y solucionar la falla básica.',
  'soat': 'Seguro Obligatorio de Accidentes de Tránsito: cubre gastos médicos y muerte de víctimas de accidentes de tránsito. Es obligatorio en Colombia para todos los vehículos.',
  'llantas': 'Cubre el daño o robo de las llantas del vehículo. Ejemplo: apareciste con las llantas pinchadas intencionalmente o te las robaron.',
  'transporte': 'Cubre gastos de movilidad alternativa (taxi, bus, etc.) mientras el carro está en taller por un siniestro cubierto.',
  'responsabilidad civil contractual': 'Cubre daños a personas o propiedades que transportas en el vehículo como parte de un contrato de servicio.',
  'responsabilidad civil bienes': 'Si con el vehículo dañas la propiedad de otra persona (un muro, una reja, un local), la aseguradora cubre el valor de los daños.',
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
  const [pos, setPos] = useState(null)
  const tip = getCoverageTip(name) || 'Esta cobertura forma parte del plan seleccionado. Consulta a tu asesor de Asegura2 para más detalles sobre sus condiciones específicas.'

  const handleEnter = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    setPos({ x: r.left + r.width / 2, y: r.top })
  }

  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
      <span style={{ fontSize:11, color:'#374151' }}>{name}</span>
      <span
        onMouseEnter={handleEnter} onMouseLeave={() => setPos(null)}
        style={{ width:13, height:13, borderRadius:'50%', background:'#e5e7eb', color:'#6b7280',
                 fontSize:8, fontWeight:800, display:'inline-flex', alignItems:'center',
                 justifyContent:'center', cursor:'help', flexShrink:0, lineHeight:1 }}>
        ?
      </span>
      {pos && (
        <span style={{
          position:'fixed', left: pos.x, top: pos.y - 8,
          transform:'translate(-50%, -100%)',
          background:'#111827', color:'#fff', fontSize:11, padding:'8px 11px',
          borderRadius:9, zIndex:99999, lineHeight:1.5, width:250,
          boxShadow:'0 4px 20px rgba(0,0,0,0.3)', pointerEvents:'none', whiteSpace:'normal',
        }}>
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
  const [pos, setPos] = useState(null)
  const tip = PLAN_TIPS[tipo]
  const label = tipo === 'full' ? 'Plan Completo (Full)' : 'Plan Básico'
  const color = tipo === 'full' ? '#7c3aed' : '#2563eb'
  const bg = tipo === 'full' ? '#ede9fe' : '#dbeafe'

  const handleEnter = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    setPos({ x: r.left + r.width / 2, y: r.top })
  }

  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
      <span style={{ background:bg, color, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99 }}>
        {label}
      </span>
      <span
        onMouseEnter={handleEnter} onMouseLeave={() => setPos(null)}
        style={{ width:15, height:15, borderRadius:'50%', background:'#e5e7eb', color:'#6b7280',
                 fontSize:9, fontWeight:800, display:'inline-flex', alignItems:'center',
                 justifyContent:'center', cursor:'help', flexShrink:0 }}>
        ?
      </span>
      {pos && (
        <span style={{
          position:'fixed', left: pos.x, top: pos.y - 8,
          transform:'translate(-50%, -100%)',
          background:'#111827', color:'#fff', fontSize:11, padding:'10px 13px',
          borderRadius:10, zIndex:99999, lineHeight:1.6, width:270,
          boxShadow:'0 4px 20px rgba(0,0,0,0.3)', pointerEvents:'none', whiteSpace:'normal',
        }}>
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
function CotizacionModal({ cotizacion, token, user, onClose, onEmitida }) {
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

  const fechaStr = `${createdAt.getDate()} ${MESES[createdAt.getMonth()]} ${createdAt.getFullYear()}`
  const nombre = cotizacion.cliente_nombre || `${formFull.nombre || ''} ${formFull.apellido || ''}`.trim() || 'Sin nombre'
  const cedula = cotizacion.cliente_cedula || formFull.numDoc || null
  const tipoCedula = cotizacion.cliente_tipo_doc || formFull.tipoDoc || null
  const placa = cotizacion.placa || null

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
        documentTypeId: f.tipoDoc || 'CC',   // backend lo normaliza a número
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
        vehicleYear: cotizacion.anio || null,
        commercialValue: cotizacion.comercial_value || null,
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
                 maxHeight:'90dvh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)',
                 margin:'0 8px' }}
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
                const renderGroup = (plans, tipo) => {
                  if (plans.length === 0) return null
                  const bestPrice = Math.min(...plans.map(q => q.price || Infinity))
                  return (
                  <div key={tipo} style={{ marginBottom:14 }}>
                    <div style={{ marginBottom:8 }}>
                      <PlanTipoTooltip tipo={tipo} />
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {plans.map((q, i) => {
                        const planKey = `${tipo}-${i}`
                        const isSel = selectedPlan?.insuranceCode === q.insuranceCode
                          && selectedPlan?.company === q.company
                          && selectedPlan?.productFull === q.productFull
                        const isOpen = expandedPlan === planKey
                        const isBest = q.price === bestPrice && bestPrice < Infinity
                        const allCov = q.coverages?.length
                          ? q.coverages
                          : [...(q.main || []), ...(q.extras || [])]
                        return (
                          <div
                            key={i}
                            style={{
                              border: isSel ? '2px solid #2D2A7A' : isBest ? '2px solid #16a34a' : '1.5px solid #e5e7eb',
                              borderRadius:12, overflow:'hidden',
                              background: isSel ? '#f5f4ff' : '#fff',
                              boxShadow: isBest && !isSel ? '0 0 0 3px rgba(22,163,74,0.1)' : 'none',
                              transition:'border-color 0.15s, background 0.15s',
                            }}
                          >
                            {/* Banner mejor precio */}
                            {isBest && (
                              <div style={{ background:'linear-gradient(90deg,#16a34a,#15803d)',
                                            padding:'4px 14px', display:'flex', alignItems:'center', gap:5 }}>
                                <span style={{ fontSize:11 }}>🏆</span>
                                <span style={{ fontSize:10, fontWeight:800, color:'#fff', letterSpacing:'0.04em' }}>
                                  MEJOR PRECIO EN ESTE GRUPO
                                </span>
                              </div>
                            )}
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
                                <p style={{ margin:0, fontSize:15, fontWeight:800, color: isBest ? '#16a34a' : '#111827' }}>{fmt(q.price)}</p>
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
                }
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

const MESES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Cotizaciones() {
  const { getToken, user } = useAuth()
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalCot, setModalCot] = useState(null)

  const hoy = new Date()
  const [mesVer, setMesVer] = useState(hoy.getMonth() + 1)   // 1-12
  const [anioVer, setAnioVer] = useState(hoy.getFullYear())

  const esActual = mesVer === hoy.getMonth() + 1 && anioVer === hoy.getFullYear()

  const fetchCotizaciones = () => {
    setLoading(true)
    fetch(`${API}/api/aliados/me/cotizaciones?mes=${mesVer}&anio=${anioVer}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      credentials: 'include',
    })
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setCotizaciones(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchCotizaciones() }, [mesVer, anioVer])

  const irMesAnterior = () => {
    if (mesVer === 1) { setMesVer(12); setAnioVer(a => a - 1) }
    else setMesVer(m => m - 1)
  }
  const irMesSiguiente = () => {
    if (esActual) return // no ir al futuro
    if (mesVer === 12) { setMesVer(1); setAnioVer(a => a + 1) }
    else setMesVer(m => m + 1)
  }

  function handleEmitida(id) {
    setCotizaciones(prev => prev.map(c => c.id === id ? { ...c, estado: 'enviada' } : c))
  }

  return (
    <div className="page-wrapper">
      <div style={{ maxWidth:'72rem', margin:'0 auto' }}>
      <div style={{ marginBottom:24, paddingTop:8 }}>
        <h1 style={{ fontFamily:'Poppins', fontSize:22, fontWeight:700, color:'#111827', margin:0 }}>Mis cotizaciones</h1>
        <p style={{ fontFamily:'Inter', fontSize:13, color:'#9ca3af', margin:'4px 0 0' }}>
          Aquí están todas las veces que cotizaste un seguro para un cliente. Puedes ver cuáles ya las enviaste a emitir y cuáles siguen abiertas.
          {' '}
          {esActual
            ? `— ${MESES_FULL[mesVer-1]} ${anioVer}`
            : `— ${MESES_FULL[mesVer-1]} ${anioVer}`}
        </p>
        {/* Navegación de mes */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:12 }}>
          <button
            onClick={irMesAnterior}
            style={{ background:'#f3f4f6', border:'none', borderRadius:8, padding:'6px 12px',
                     cursor:'pointer', fontSize:13, color:'#374151', fontWeight:600 }}>
            ← Anterior
          </button>
          <span style={{ fontSize:13, fontWeight:700, color:'#111827', minWidth:140, textAlign:'center' }}>
            {MESES_FULL[mesVer-1]} {anioVer}
            {esActual && <span style={{ marginLeft:6, fontSize:11, background:'#dcfce7', color:'#16a34a', borderRadius:99, padding:'2px 8px', fontWeight:600 }}>Mes actual</span>}
          </span>
          <button
            onClick={irMesSiguiente}
            disabled={esActual}
            style={{ background: esActual ? '#f9fafb' : '#f3f4f6', border:'none', borderRadius:8,
                     padding:'6px 12px', cursor: esActual ? 'default' : 'pointer',
                     fontSize:13, color: esActual ? '#d1d5db' : '#374151', fontWeight:600 }}>
            Siguiente →
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12, animation:'skpulse 1.5s ease-in-out infinite' }}>
          <style>{`@keyframes skpulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ background:'#fff', borderRadius:16, border:'1px solid #f3f4f6', padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
              {/* ícono circular */}
              <div style={{ width:38, height:38, borderRadius:'50%', background:'#f0f1f3', flexShrink:0 }} />
              {/* texto */}
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7 }}>
                <div style={{ background:'#f0f1f3', borderRadius:5, height:13, width:'48%' }} />
                <div style={{ background:'#f0f1f3', borderRadius:5, height:11, width:'72%' }} />
              </div>
              {/* badge + botón */}
              <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                <div style={{ background:'#f0f1f3', borderRadius:99, height:22, width:72 }} />
                <div style={{ background:'#f0f1f3', borderRadius:99, height:28, width:64 }} />
              </div>
            </div>
          ))}
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
                className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {/* Ícono */}
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Car size={16} className="text-blue-600" />
                  </div>
                  {/* Contenido — ocupa el ancho restante */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {c.cliente_nombre || 'Cliente sin nombre'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {c.cliente_tipo_doc && c.cliente_cedula
                        ? `${c.cliente_tipo_doc} ${c.cliente_cedula} · `
                        : ''}
                      {c.placa || 'Sin placa'}
                      {' · '}{fechaStr}
                    </p>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginTop:6 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                        <span style={{ background: badge.bg, color: badge.color, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, whiteSpace:'nowrap' }}>
                          {badge.label}
                        </span>
                        {noEnviada && !within24h && (
                          <span style={{ fontSize:10, color:'#ea580c', fontWeight:600 }}>Vencida</span>
                        )}
                      </div>
                      <button
                        onClick={() => setModalCot(c)}
                        style={{ display:'flex', alignItems:'center', gap:3, background:'#f3f4f6', border:'none',
                                 borderRadius:99, padding:'5px 11px', cursor:'pointer', color:'#374151',
                                 fontSize:12, fontWeight:600, whiteSpace:'nowrap', flexShrink:0,
                                 transition:'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background='#e5e7eb'}
                        onMouseLeave={e => e.currentTarget.style.background='#f3f4f6'}
                      >
                        Ver más
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </button>
                    </div>
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
          onEmitida={handleEmitida}
        />
      )}
      </div>
    </div>
  )
}
