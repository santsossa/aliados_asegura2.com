import React, { useState, useEffect, Fragment } from 'react'
import cotizarplacaImg from '../../assets/cotizarplaca.webp'
import cotizar0kmImg from '../../assets/cotizar0km.webp'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ComboBox from '../../components/ComboBox'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/* ── helpers ──────────────────────────────────────────────────────────────── */
const formatPlate = raw => {
  const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  let out = '', letters = 0, digits = 0
  for (const ch of clean) {
    if (/[A-Z]/.test(ch) && letters < 3 && digits === 0) { out += ch; letters++ }
    else if (/[0-9]/.test(ch) && letters === 3 && digits < 3) { out += ch; digits++ }
  }
  return out
}
const displayPlate = p => p.length > 3 ? p.slice(0, 3) + ' ' + p.slice(3) : p
const isValidPlate = p => /^[A-Z]{3}\d{3}$/.test(p)
const fmt = n => '$' + Math.round(n).toLocaleString('es-CO', { maximumFractionDigits: 0 })

const DOC_OPTIONS = [
  { v:'CC', label:'Cédula de ciudadanía' }, { v:'CE', label:'Cédula de extranjería' },
  { v:'PA', label:'Pasaporte' },             { v:'NIT', label:'NIT' },
]
const GENDER_OPTIONS = [{ v:'M', label:'Masculino' }, { v:'F', label:'Femenino' }]
const DAY_OPTIONS   = Array.from({ length:31 }, (_,i) => ({ v:String(i+1), label:String(i+1) }))
const MONTH_OPTIONS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
                      .map((m,i) => ({ v:String(i+1), label:m }))
const YEAR_OPTIONS  = Array.from({ length:2008-1940+1 }, (_,i) => ({ v:String(2008-i), label:String(2008-i) }))

const COMPANY_MAP = [
  { keys:['allianz'],           name:'Allianz',           logo:'/logos/allianz.webp'   },
  { keys:['axa','colpatria'],   name:'AXA Colpatria',     logo:'/logos/axa.webp'       },
  { keys:['bolívar','bolivar'], name:'Seguros Bolívar',   logo:'/logos/bolivar.webp'   },
  { keys:['equidad'],           name:'La Equidad',        logo:'/logos/equidad.webp'   },
  { keys:['hdi'],               name:'HDI Seguros',       logo:'/logos/hdi.webp'       },
  { keys:['mapfre'],            name:'Mapfre',            logo:'/logos/mapfre.webp'    },
  { keys:['sbs'],               name:'SBS Seguros',       logo:'/logos/sbs.webp'       },
  { keys:['solidaria'],         name:'Seguros Solidaria', logo:'/logos/solidaria.webp' },
  { keys:['qualitas'],          name:'Qualitas',           logo:'/logos/qualitas.webp'  },
]
function resolveCompany(apiName = '') {
  const lower = apiName.toLowerCase()
  const m = COMPANY_MAP.find(c => c.keys.some(k => lower.includes(k)))
  return m ? { name:m.name, logo:m.logo } : { name: apiName || 'Aseguradora', logo:'' }
}
let _idCounter = 0
function mapPlan(resp) {
  const coverages = Array.isArray(resp.coverages)
    ? resp.coverages.map(c => c.name).filter(n => n && !/no\s+tiene|[-–—]{3,}/i.test(n)) : []
  const co = resolveCompany(resp.insuranceCarrier || '')
  return {
    id: `p-${++_idCounter}`, carrierId: resp.insuranceCarrierId || resp.insuranceCode || null,
    insuranceCode: resp.insuranceCode || null, company: co.name, logo: co.logo,
    price: resp.yearlyTotal || resp.monthlyTotal || 0,
    coverages,                          // TODAS las coberturas — para guardar en DB
    main: coverages.slice(0,3),         // primeras 3 — para preview rápido en PlanCard
    extras: coverages.slice(3),         // el resto — para expandir en PlanCard
    productFull: resp.productFull === true || (resp.insuranceCarrier||'').toLowerCase().includes('hdi'),
    raw: resp,
  }
}

/* ── coverage tooltips ───────────────────────────────────────────────────── */
const COVERAGE_TIPS = {
  // ── Responsabilidad Civil ──────────────────────────────────────────────────
  'responsabilidad civil extracontractual': 'Si en un accidente le causas daños al carro de otra persona o la hieres, la aseguradora paga por ti. Ejemplo: chocas en un semáforo y le rompes el parabrisas al otro conductor — la aseguradora lo repara y cubre su atención médica si la necesita.',
  'responsabilidad civil': 'Cubre los daños económicos que le causes a terceros (personas, carros, bienes) en un accidente. Ejemplo: pierdes el control en la vía y dañas un local comercial — la aseguradora paga los daños a los dueños del local.',
  'rc extracontractual': 'Si en un accidente causas daños a personas o propiedades ajenas, la aseguradora responde económicamente por ti ante los afectados.',
  'rc daños a terceros': 'Cubre lo que tengas que pagarle a otras personas por daños que hayas causado con tu vehículo, ya sea a sus carros, a su propiedad o a ellos mismos.',
  'rc bienes': 'Si con el vehículo dañas la propiedad de otra persona (un muro, una reja, un local), la aseguradora cubre el valor de los daños.',
  'rc personas': 'Si en un accidente hieres a alguien, la aseguradora paga los gastos médicos, hospitalización y demás costos relacionados con su lesión.',

  // ── Daños al vehículo propio ───────────────────────────────────────────────
  'todo riesgo': 'La protección más completa: cubre cualquier daño a tu carro sin importar si el accidente fue culpa tuya. Ejemplo: raspas el carro al parquear, te chocas en la autopista, o te cae un árbol encima — todo cubierto.',
  'daños propios': 'Si tu carro sufre daños por un choque, golpe o accidente en el que tengas culpa, la aseguradora paga la reparación. Ejemplo: se te fue el pie del freno y golpeaste una columna — la aseguradora cubre el taller.',
  'colisión': 'Cubre los daños de tu vehículo cuando impacta contra otro objeto o vehículo, sin importar quién tuvo la culpa. Ejemplo: un bus te chocó por detrás en un trancón — tu aseguradora repara tu carro mientras se resuelve quién paga.',
  'pérdida parcial': 'Cuando el carro sufre daños que se pueden reparar (no queda destruido del todo). Ejemplo: un accidente moderado abolló la puerta y el guardafango — la aseguradora paga el taller de latonería.',
  'daño': 'Cubre reparaciones por daños físicos al vehículo causados por choques, golpes o impactos. Ejemplo: alguien te golpeó en el parqueadero y se fue — la aseguradora cubre la reparación de los daños.',

  // ── Pérdida Total ──────────────────────────────────────────────────────────
  'pérdida total por accidente': 'Si el carro queda tan destruido en un choque que cuesta más repararlo que reemplazarlo (más del 75% de su valor), la aseguradora te paga su valor comercial para que puedas comprar otro.',
  'pérdida total por hurto': 'Si te roban el carro y transcurridos 30 días no aparece, la aseguradora te paga el valor comercial del vehículo para que puedas reemplazarlo.',
  'pérdida total': 'Si el carro queda completamente destruido o es robado sin aparecer, la aseguradora te paga su valor de mercado. No te quedas sin nada.',

  // ── Hurto ──────────────────────────────────────────────────────────────────
  'hurto parcial': 'Si te roban partes del carro sin llevárselo completo (espejos, rines, batería, luces, catalizador, etc.), la aseguradora cubre el reemplazo de esas partes.',
  'hurto': 'Si te roban el carro completo y no aparece en el tiempo estipulado, la aseguradora te paga su valor comercial para que puedas comprar otro.',
  'robo': 'Cobertura contra robo del vehículo. Si te lo robaron y no fue recuperado, la aseguradora te indemniza con el valor comercial del carro.',

  // ── Asistencia en vía ──────────────────────────────────────────────────────
  'asistencia en carretera': 'Si el carro se daña en la vía y no puedes seguir el viaje, la aseguradora te manda ayuda donde estés: grúa, mecánico, cambio de llanta o combustible. Ejemplo: te pinchaste una llanta a las 11 pm en la vía a Bogotá — un técnico va hasta donde estás.',
  'auxilio en carretera': 'Si te quedas varado en la carretera por llanta pinchada, batería descargada o falta de combustible, la aseguradora envía asistencia al lugar donde estés.',
  'asistencia vial': 'Servicio de ayuda en carretera que incluye grúa, cambio de llanta, carga de batería y envío de gasolina. Ideal para emergencias en ruta.',
  'asistencia': 'Servicio de apoyo ante emergencias del vehículo en la vía: grúa, mecánico, cambio de llanta, batería. Te ayudan donde estés.',
  'grúa': 'Si el carro no puede moverse (por accidente o daño mecánico), la aseguradora paga el transporte hasta el taller más cercano. No tienes que buscar ni pagar la grúa.',
  'auxilio': 'Servicio de asistencia ante emergencias del vehículo. Incluye ayuda mecánica básica, cambio de llanta y remolque si es necesario.',

  // ── Vehículo de reemplazo ──────────────────────────────────────────────────
  'vehículo de reemplazo': 'Si el carro está en el taller por un siniestro cubierto, la aseguradora te entrega otro vehículo para que no quedes sin transporte durante los días de reparación.',
  'auto sustituto': 'Mientras el carro está en reparación por un siniestro, la aseguradora te presta un vehículo sustituto. Ejemplo: tu carro tarda 5 días en el taller — la aseguradora te da un carro prestado esos días.',
  'carro de reemplazo': 'La aseguradora te facilita un vehículo de reemplazo mientras el tuyo está siendo reparado por un siniestro cubierto por la póliza.',
  'renta diaria': 'Si el carro está en el taller por un accidente cubierto, la aseguradora te da un dinero diario para que puedas pagar transporte mientras se repara.',

  // ── Cristales ──────────────────────────────────────────────────────────────
  'cristales': 'Si el parabrisas, las ventanas laterales o el vidrio trasero se rompen (por una piedra, un impacto u otro motivo), la aseguradora paga el reemplazo. No necesitas que haya habido un choque.',
  'vidrios': 'Cubre la rotura del parabrisas y ventanas del carro. Ejemplo: una piedra que saltó de un camión te rompió el parabrisas — la aseguradora lo reemplaza.',

  // ── Salud y vida de ocupantes ──────────────────────────────────────────────
  'gastos médicos': 'Si el conductor o los pasajeros salen heridos en un accidente, la aseguradora ayuda a cubrir los costos de atención médica, hospitalización y tratamiento.',
  'accidentes personales': 'Protege económicamente al conductor y los pasajeros ante lesiones en un accidente de tránsito. Cubre gastos médicos, incapacidad temporal o permanente y muerte accidental.',
  'muerte accidental': 'Si el conductor o un pasajero fallece a causa de un accidente de tránsito, la aseguradora paga una suma de dinero a sus beneficiarios (familia).',
  'muerte e incapacidad': 'Cubre tanto el fallecimiento como las lesiones que generen incapacidad permanente del conductor o pasajeros en un accidente de tránsito.',
  'incapacidad permanente': 'Si como resultado de un accidente quedas con una limitación física permanente, la aseguradora te paga una compensación económica según el grado de incapacidad.',
  'invalidez': 'Si por un accidente de tránsito quedas con una discapacidad permanente (no puedes trabajar o realizar tus actividades normales), la aseguradora te paga una indemnización.',

  // ── Conductor Elegido ──────────────────────────────────────────────────────
  'conductor elegido': 'Servicio donde la aseguradora te manda un conductor profesional a donde estés para que maneje tu carro hasta donde necesitas ir. Ideal si tomaste licor, estás cansado o simplemente no quieres manejar. Es como un chofer temporal en tu propio carro.',
  'conductor': 'Servicio de conductor a domicilio: un profesional va hasta donde estás y maneja tu carro hasta tu destino. Muy útil si saliste a un evento y no quieres manejar de regreso.',

  // ── Incendio y Fenómenos Naturales ────────────────────────────────────────
  'incendio': 'Si el carro se incendia (por falla eléctrica, cortocircuito o cualquier otra causa), la aseguradora cubre los daños o te paga el valor del vehículo si quedó destruido.',
  'terremoto': 'Si un sismo, temblor o erupción volcánica daña tu carro, la aseguradora cubre los daños aunque no hayas tenido ninguna culpa.',
  'fenómenos naturales': 'Cubre daños causados por eventos naturales: granizo que abolló el capó, una inundación que dañó el motor, un vendaval que tiró un árbol sobre el carro, etc.',
  'fenomenos de la naturaleza': 'Protege el vehículo ante daños causados por lluvias, granizadas, vendavales, terremotos, derrumbes o avalanchas.',
  'inundación': 'Si el carro se inunda por lluvias fuertes o desbordamiento de un río o canal, la aseguradora cubre los daños al motor y partes eléctricas.',
  'riesgos de la naturaleza': 'Cobertura para daños causados por fenómenos climáticos o naturales que afecten el vehículo: granizo, viento, inundaciones, rayos, sismos.',
  'riesgo de la naturaleza': 'Protege el carro contra daños ocasionados por eventos naturales como granizo, vendavales, inundaciones o terremotos.',

  // ── Actos Mal Intencionados / Vandalismo ──────────────────────────────────
  'actos mal intencionados': 'Si alguien daña el carro a propósito (rayan la pintura, rompen un vidrio, le dan golpes sin robar), la aseguradora cubre la reparación.',
  'vandalismo': 'Cubre daños intencionales al carro hechos por terceros: pintura rayada, espejos rotos, llantas ponchadas adrede. Ejemplo: en una manifestación dañaron tu carro.',
  'actos de terceros': 'Si alguien daña tu vehículo intencionalmente sin robártelo, la aseguradora cubre los costos de reparación.',

  // ── Servicios de conveniencia ──────────────────────────────────────────────
  'llamada médica': 'Acceso a orientación médica telefónica las 24 horas del día. Si tienes una emergencia de salud en la vía, llamas y un médico te indica qué hacer mientras llega ayuda.',
  'orientación jurídica': 'Si tienes un accidente y no sabes qué hacer legalmente (quién es culpable, qué derechos tienes, cómo proceder), la aseguradora te conecta con un abogado que te asesora.',
  'defensa jurídica': 'La aseguradora te proporciona representación legal si eres demandado por un accidente de tránsito. Cubre honorarios de abogado y costos del proceso judicial básico.',
  'asesoría jurídica': 'Asesoría legal ante accidentes de tránsito: un abogado te explica tus derechos y cómo actuar si te demandan o necesitas demandar.',
  'traslado de pasajeros': 'Si el carro se daña lejos de tu ciudad y no pueden continuar el viaje, la aseguradora paga los tiquetes de bus o avión para que los pasajeros regresen a casa.',
  'taxi': 'Si el carro está en el taller varios días por un siniestro, la aseguradora cubre algunos viajes en taxi para que no te quedes sin movilidad.',
  'estadía': 'Si el carro se daña en otra ciudad y no puedes regresar ese día, la aseguradora puede pagar el hospedaje en un hotel mientras se repara o remolca el vehículo.',
  'llave de emergencia': 'Si pierdes las llaves del carro o te quedas encerrado afuera, la aseguradora envía un cerrajero para abrirlo o conseguir una llave de repuesto.',
  'cerrajería': 'Servicio de cerrajero incluido: si pierdes la llave del carro o se queda dentro, la aseguradora te manda un experto que lo abre sin dañarlo.',
  'combustible': 'Si te quedas sin gasolina en la vía, la aseguradora te envía combustible al lugar donde estás, para que puedas llegar al próximo puesto de gasolina.',
  'batería': 'Si la batería del carro se descarga y no puede arrancar, la aseguradora te manda asistencia para cargarla o reemplazarla.',

  // ── Accesorios ────────────────────────────────────────────────────────────
  'accesorios': 'Cubre el robo o daño de accesorios instalados en el carro que no son de fábrica: pantallas multimedia, parlantes, rines especiales, cámaras de reversa, etc.',
  'accesorios instalados': 'Si te roban o dañan elementos que instalaste en el carro (pantalla, parlantes, cámara, rines), la aseguradora los repone según el valor asegurado.',
  'equipos de sonido': 'Cubre el robo o daño del sistema de audio del carro (radio, amplificador, parlantes, subwoofer). Ejemplo: te rompieron el vidrio y robaron el equipo de sonido — la aseguradora lo repone.',

  // ── Otros específicos ──────────────────────────────────────────────────────
  'rc': 'Responsabilidad Civil: si en un accidente le causas daños a otra persona o su vehículo, la aseguradora paga por ti para que no tengas que hacerlo de tu bolsillo.',
  'sarlaft': 'Proceso legal requerido en Colombia para verificar que el titular del seguro no está en listas de control (lavado de activos). Es un trámite regulatorio obligatorio, no una cobertura adicional.',
  'checkup': 'Revisión técnica preventiva del vehículo incluida en la póliza. Un mecánico revisa el estado general del carro para detectar fallas antes de que se conviertan en problemas mayores.',
  'check up': 'Revisión preventiva del vehículo: un técnico hace una inspección general del carro para asegurarse de que todo funciona bien y prevenir averías.',
  'mecánico': 'Si el carro tiene un problema mecánico en la vía, la aseguradora envía un mecánico al lugar donde estás para diagnosticar y solucionar la falla básica.',
  'plan basico soat': 'Cobertura mínima equivalente al SOAT: protege únicamente en caso de accidentes que causen lesiones o muerte a personas (conductores, pasajeros o peatones). No cubre daños al vehículo.',
  'soat': 'Seguro Obligatorio de Accidentes de Tránsito: cubre gastos médicos, rehabilitación y muerte de víctimas de accidentes de tránsito. Es obligatorio en Colombia para todos los vehículos.',
}

function getCoverageTip(name = '') {
  const lower = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') // quita tildes
  // Buscar coincidencia exacta primero, luego parcial
  const keys = Object.keys(COVERAGE_TIPS)
  const exact = keys.find(k => {
    const kn = k.normalize('NFD').replace(/[̀-ͯ]/g, '')
    return lower === kn || lower.includes(kn) || kn.includes(lower)
  })
  if (exact) return COVERAGE_TIPS[exact]
  // Buscar por palabras clave individuales
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
  const [pos, setPos] = React.useState(null)
  const tip = getCoverageTip(name) || 'Esta cobertura forma parte del plan seleccionado. Consulta a tu asesor de Asegura2 para más detalles sobre sus condiciones específicas.'

  const handleEnter = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    setPos({ x: r.left + r.width / 2, y: r.top })
  }
  const handleLeave = () => setPos(null)

  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
      <span>{name}</span>
      <span
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{ width:14, height:14, borderRadius:'50%', background:'#e5e7eb', color:'#6b7280',
                 fontSize:9, fontWeight:800, display:'inline-flex', alignItems:'center',
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

// ── Tooltip Plan Full vs Básico ───────────────────────────────────────────────
const PLAN_TIPO_TIPS = {
  full: 'El plan COMPLETO (Full) cubre todo riesgo: protege tu carro contra daños propios por choques, raspones, volcamiento, pérdida total, hurto, cristales y fenómenos naturales. También incluye responsabilidad civil ante terceros y servicios como grúa, auto sustituto y asistencia en carretera. Es la protección más amplia disponible.',
  basico: 'El plan BÁSICO cubre lo esencial: responsabilidad civil ante terceros (si le causas daño a otra persona o su vehículo) y pérdida total (si el carro queda destruido o es robado y no aparece). No cubre daños propios por choques ni raspones. Ideal para quienes buscan el menor costo con lo mínimo indispensable.',
}
function PlanTipoTooltip({ tipo }) {
  const [pos, setPos] = React.useState(null)
  const tip = PLAN_TIPO_TIPS[tipo]

  const handleEnter = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    setPos({ x: r.left + r.width / 2, y: r.top })
  }

  return (
    <span style={{ display:'inline-flex', alignItems:'center' }}>
      <span
        onMouseEnter={handleEnter} onMouseLeave={() => setPos(null)}
        style={{ width:16, height:16, borderRadius:'50%', background:'#e5e7eb', color:'#6b7280',
                 fontSize:9, fontWeight:800, display:'inline-flex', alignItems:'center',
                 justifyContent:'center', cursor:'help', flexShrink:0 }}>
        ?
      </span>
      {pos && (
        <span style={{
          position:'fixed', left: pos.x, top: pos.y - 8,
          transform:'translate(-50%, -100%)',
          background:'#111827', color:'#fff', fontSize:11, padding:'10px 13px',
          borderRadius:10, zIndex:99999, lineHeight:1.6, width:280,
          boxShadow:'0 4px 20px rgba(0,0,0,0.3)', pointerEvents:'none', whiteSpace:'normal',
        }}>
          {tip}
        </span>
      )}
    </span>
  )
}

/* ── mini components ─────────────────────────────────────────────────────── */
// Alias local para no romper referencias — usa el ComboBox global
function Sel({ value, onChange, options, placeholder }) {
  return <ComboBox value={value} onChange={onChange} options={options} placeholder={placeholder || 'Selecciona...'} />
}
function Inp({ value, onChange, placeholder, type='text' }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e5e7eb', borderRadius:10,
               fontSize:14, color:'#111827', background:'#fff', boxSizing:'border-box', outline:'none' }}
      onFocus={e => e.target.style.borderColor='#2D2A7A'}
      onBlur={e => e.target.style.borderColor='#e5e7eb'} />
  )
}
function Fld({ label, children }) {
  return <div style={{ marginBottom:14 }}><div style={{ fontSize:12,fontWeight:600,color:'#374151',marginBottom:6 }}>{label}</div>{children}</div>
}

function PlanCard({ plan, onElegir, isBest = false }) {
  const [open, setOpen] = useState(false)
  const allCoverages = [...plan.main, ...plan.extras]
  return (
    <div style={{
      background:'#fff',
      border: isBest ? '2px solid #16a34a' : '1.5px solid #e5e7eb',
      borderRadius:14, overflow:'hidden', marginBottom:10,
      transition:'box-shadow 0.15s',
      boxShadow: isBest ? '0 0 0 3px rgba(22,163,74,0.1)' : 'none',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow= isBest ? '0 4px 16px rgba(22,163,74,0.2)' : '0 4px 16px rgba(45,42,122,0.12)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow= isBest ? '0 0 0 3px rgba(22,163,74,0.1)' : 'none'}>

      {/* Banner "Mejor precio" */}
      {isBest && (
        <div style={{
          background:'linear-gradient(90deg,#16a34a,#15803d)',
          padding:'5px 20px',
          display:'flex', alignItems:'center', gap:6,
        }}>
          <span style={{ fontSize:13 }}>🏆</span>
          <span style={{ fontSize:11, fontWeight:800, color:'#fff', letterSpacing:'0.04em' }}>
            MEJOR PRECIO EN ESTE GRUPO
          </span>
        </div>
      )}

      {/* ── Fila principal ── */}
      <div style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px' }}>
        {/* Logo */}
        <div style={{ width:64, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#f9fafb', borderRadius:10, padding:'6px 8px', minHeight:40 }}>
          {plan.logo ? (
            <img src={plan.logo} alt={plan.company} style={{ maxWidth:52, maxHeight:30, objectFit:'contain' }}
              onError={e => {
                e.currentTarget.style.display='none'
                const span = e.currentTarget.nextSibling
                if (span) span.style.display='block'
              }} />
          ) : null}
          <span style={{ fontSize:9,fontWeight:700,color:'#6b7280',textAlign:'center',lineHeight:1.2,display: plan.logo ? 'none' : 'block' }}>
            {plan.company.split(' ').slice(0,2).join('\n')}
          </span>
        </div>

        {/* Nombre + botón coberturas */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:14, color:'#111827', marginBottom:6 }}>{plan.company}</div>
          <button onClick={() => setOpen(v=>!v)}
            style={{ fontSize:11, color: open ? '#6b7280' : '#2D2A7A', background: open ? '#f9fafb' : '#edeef8',
                     border:'none', borderRadius:99, padding:'4px 12px', cursor:'pointer', fontWeight:600,
                     display:'flex', alignItems:'center', gap:4 }}>
            {open
              ? <>↑ Ocultar coberturas</>
              : <>{allCoverages.length > 0 ? `↓ Ver ${allCoverages.length} coberturas` : 'Sin coberturas detalladas'}</>
            }
          </button>
        </div>

        {/* Precio + elegir */}
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:2 }}>Prima anual</div>
          <div style={{ fontSize:20, fontWeight:800, color:'#111827', lineHeight:1 }}>{fmt(plan.price)}</div>
          <div style={{ fontSize:10, color:'#9ca3af', marginBottom:10 }}>11 cuotas de {fmt(Math.ceil(plan.price/11))}</div>
          <button onClick={() => onElegir(plan)}
            style={{ background:'#2D2A7A', color:'#fff', border:'none', borderRadius:99, padding:'9px 20px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            Elegir →
          </button>
        </div>
      </div>

      {/* ── Coberturas expandidas ── */}
      {open && (
        <div style={{ borderTop:'1px solid #f3f4f6', padding:'14px 20px 18px' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px 20px' }}>
            {allCoverages.map((item,i) => (
              <span key={i} style={{ fontSize:12, color:'#374151', display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ color:'#16a34a', fontWeight:700, fontSize:13 }}>✓</span>
                <CovTooltip name={item} />
              </span>
            ))}
          </div>
          {allCoverages.length === 0 && (
            <p style={{ fontSize:12, color:'#9ca3af', margin:0 }}>No se encontraron detalles de coberturas para este plan.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Drag & Drop file upload ───────────────────────────────────────────────────
function DragDropFile({ label, file, onChange, accept = '.pdf,.jpg,.jpeg,.png' }) {
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef()

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) onChange(f)
  }
  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  const border = file ? '#2D2A7A' : dragging ? '#6366f1' : '#e5e7eb'
  const bg     = file ? '#f0f0fd' : dragging ? '#eef2ff' : '#f9fafb'

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:12, fontWeight:600, color:'#374151', marginBottom:6 }}>{label}</div>
      <div
        onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        style={{ border:`2px dashed ${border}`, borderRadius:12, padding:'18px 16px',
                 cursor:'pointer', background:bg, transition:'all 0.2s',
                 display:'flex', alignItems:'center', gap:12 }}
      >
        <span style={{ fontSize:26, flexShrink:0 }}>
          {file ? (file.name.endsWith('.pdf') ? '📄' : '🖼️') : dragging ? '📂' : '📎'}
        </span>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:0, fontSize:13, fontWeight: file ? 700 : 400,
                      color: file ? '#2D2A7A' : dragging ? '#6366f1' : '#9ca3af',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {file ? file.name : dragging ? 'Suelta el archivo aquí' : 'Arrastra o toca para adjuntar'}
          </p>
          {!file && <p style={{ margin:'2px 0 0', fontSize:11, color:'#9ca3af' }}>PDF, JPG o PNG</p>}
        </div>
        {file && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(null) }}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:16, padding:0, flexShrink:0 }}>
            ✕
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} style={{ display:'none' }}
        onChange={e => onChange(e.target.files?.[0] || null)} />
    </div>
  )
}

/* ── styles ──────────────────────────────────────────────────────────────── */
const card = { background:'#fff', borderRadius:20, padding:'28px 24px', boxShadow:'0 2px 20px rgba(0,0,0,0.06)', maxWidth:520, margin:'0 auto' }
const btnP = (disabled=false) => ({ background: disabled ? '#9ca3af':'#2D2A7A', color:'#fff', border:'none', borderRadius:99, padding:'12px 28px', fontSize:14, fontWeight:700, cursor: disabled?'not-allowed':'pointer', transition:'background 0.2s' })
const btnS = { background:'none', border:'1.5px solid #e5e7eb', borderRadius:99, padding:'11px 22px', fontSize:14, fontWeight:600, color:'#374151', cursor:'pointer' }

/* ══════════════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════════════ */
export default function Cotizar() {
  const { getToken, user } = useAuth()
  const navigate = useNavigate()
  const [phase, setPhase] = useState('select')
  const [usadoHov, setUsadoHov] = useState(false)
  const [plate, setPlate] = useState('')
  const [step,  setStep]  = useState(1)
  const [cities, setCities]   = useState([])
  const [cityName, setCityName] = useState('')
  const [vehicleModel, setVehicleModel]   = useState('')
  const [commercialValue, setCommercialValue] = useState(null)

  const [form, setForm] = useState({
    nombre:'', apellido:'', gender:'', tipoDoc:'CC', numDoc:'',
    diaNac:'', mesNac:'', anioNac:'', correo:'', ciudad:'', celular:'',
  })
  const setF = (k,v) => setForm(f => ({ ...f, [k]:v }))

  const [fullPlans,  setFullPlans]  = useState([])
  const [basicPlans, setBasicPlans] = useState([])
  const [loadingQ, setLoadingQ] = useState(false)
  const [progress, setProgress] = useState({ done:0, total:0 })
  const [fetchErr, setFetchErr] = useState('')

  const [selectedPlan, setSelectedPlan] = useState(null)
  const [cedulaFile,   setCedulaFile]   = useState(null)
  const [tarjetaFile,  setTarjetaFile]  = useState(null)
  const [sending, setSending] = useState(false)
  const [sendErr, setSendErr] = useState('')

  const [showReminder, setShowReminder]   = useState(false)
  const [pendingPlan,  setPendingPlan]    = useState(null)
  const [cotSaved,     setCotSaved]       = useState(false)
  const cotizacionIdRef = React.useRef(null)

  const authH = { Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json' }

  // Cargar ciudades
  useEffect(() => {
    fetch(`${API}/api/cotizar/municipios`, { headers: authH })
      .then(r => r.json())
      .then(d => setCities(d?.response || d?.data?.response || []))
      .catch(() => {})
  }, [])

  // Parsea valor numérico tolerando formato colombiano "45.000.000"
  function parseNumericCV(raw) {
    if (raw == null || raw === '') return null
    // Si ya es número positivo, úsalo directamente
    if (typeof raw === 'number' && raw > 0) return raw
    // Limpiar formato colombiano: quitar puntos de miles, cambiar coma decimal por punto
    const cleaned = String(raw).replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '')
    const n = Number(cleaned)
    return (!isNaN(n) && n > 0) ? n : null
  }

  // Extrae valor comercial — búsqueda profunda en cualquier estructura de respuesta
  function extractCV(obj, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 4) return null
    for (const k of ['valorAsegurado','commercialValue','insuredValue','vehicleValue','valor','value']) {
      const v = parseNumericCV(obj[k])
      if (v != null) return v
    }
    // Buscar en sub-objetos comunes
    for (const nested of ['response','data','result','vehicle','vehiculo']) {
      if (obj[nested] && typeof obj[nested] === 'object') {
        const v = extractCV(obj[nested], depth + 1)
        if (v != null) return v
      }
    }
    return null
  }

  // Confirmar placa → pedir datos fasecolda
  function handlePlateConfirm() {
    fetch(`${API}/api/cotizar/fasecolda`, {
      method:'POST', headers: authH,
      body: JSON.stringify({ Placa: plate.toUpperCase(), Modelo:'' }),
    })
      .then(r => r.json())
      .then(d => {
        if (d._modelo) setVehicleModel(/(\d{4})/.exec(d._modelo)?.[1] || d._modelo)
        else {
          const info = d?.response || d
          if (info?.modelo) setVehicleModel(/(\d{4})/.exec(info.modelo)?.[1] || info.modelo)
        }
        if (d._valorAsegurado != null && d._valorAsegurado > 0) {
          setCommercialValue(d._valorAsegurado)
        }
        // Si Fasecolda falló, marcar para mostrar mensaje apropiado
        if (d._fasecoldaFallo) setCommercialValue(-1) // -1 = "Fasecolda no disponible, buscar en quotes"
      })
      .catch(() => {})
    setPhase('form'); setStep(1)
  }

  // Cotizaciones — stream progresivo: cada quote aparece en cuanto llega
  async function fetchQuotes() {
    setLoadingQ(true); setFetchErr(''); setFullPlans([]); setBasicPlans([])
    setProgress({ done:0, total:0 })
    const collectedFull = []; const collectedBasic = []

    // AbortController para cancelar fetches pendientes al terminar
    const abortCtrl = new AbortController()
    const signal = abortCtrl.signal

    const birthDate = `${form.anioNac}-${String(form.mesNac).padStart(2,'0')}-${String(form.diaNac).padStart(2,'0')}`
    const model = {
      documentTypeId: form.tipoDoc,    identification: form.numDoc,
      firstName:      form.nombre,     lastName:       form.apellido,
      birthDate,                       plate,
      municipalityId: form.ciudad,     mobileNumber:   form.celular,
      genderId:       form.gender==='M' ? 1 : 2,
      gender:         form.gender,     email:          form.correo,
      city:           cityName,        vehicleModel,
    }

    try {
      const provR = await fetch(`${API}/api/cotizar/proveedores`, { headers: authH, signal })
      const provD = await provR.json()
      const providers = provD?.response || provD?.data?.response || []
      if (!providers.length) { setFetchErr('No se encontraron proveedores.'); return }
      setProgress({ done:0, total: providers.length })

      let done = 0

      await Promise.allSettled(
        providers.map(provider => {
          const timeoutId = setTimeout(() => { done++; setProgress({ done, total: providers.length }) }, 15000)
          return fetch(`${API}/api/cotizar/quote`, {
            method:'POST', headers: authH, signal,
            body: JSON.stringify({ ...model, provider }),
          })
            .then(r => r.json())
            .then(d => {
              clearTimeout(timeoutId)
              const resp = d?.response
              const price = parseFloat(resp?.yearlyTotal || resp?.monthlyTotal || 0)
              if (resp && !resp.error && price > 0) {
                const plan = mapPlan(resp)
                // Ocultar Seguros del Estado — no mostrar al aliado
                const carrierRaw = (resp.insuranceCarrier || '').toLowerCase()
                const isEstado = carrierRaw.includes('estado') || plan.company.toLowerCase().includes('estado')
                if (!isEstado) {
                  // Tomar valor del quote si Fasecolda falló o aún no tenemos el valor
                  const cv = extractCV(resp)
                  if (cv != null && cv > 0) setCommercialValue(prev => (!prev || prev <= 0) ? cv : prev)
                  if (plan.productFull) { collectedFull.push(plan); setFullPlans(p => [...p, plan].sort((a,b) => a.price-b.price)) }
                  else                  { collectedBasic.push(plan); setBasicPlans(p => [...p, plan].sort((a,b) => a.price-b.price)) }
                }
              }
            })
            .catch(() => { clearTimeout(timeoutId) })
            .finally(() => { done++; setProgress({ done, total: providers.length }) })
        })
      )
      // Fallback: si ningún proveedor devolvió el valor, buscarlo en los planes ya recibidos
      setFullPlans(prev => {
        setBasicPlans(bPrev => {
          const all = [...prev, ...bPrev]
          const cv = all.map(p => extractCV(p.raw)).find(v => v)
          if (cv) setCommercialValue(Number(cv))
          return bPrev
        })
        return prev
      })
    } catch (err) {
      if (err?.name !== 'AbortError') setFetchErr('No se pudieron obtener cotizaciones. Intenta nuevamente.')
    } finally {
      abortCtrl.abort() // cancela cualquier fetch que todavía no haya respondido
      setLoadingQ(false)
      saveCotizacionWithPlans(collectedFull, collectedBasic)
    }
  }

  const quotesLoadedRef = React.useRef(false)

  useEffect(() => {
    if (phase === 'results' && !quotesLoadedRef.current) {
      quotesLoadedRef.current = true
      fetchQuotes()
    }
  }, [phase])

  // Ref siempre actualizado — resuelve stale closure en cleanup
  const saveRef = React.useRef({})
  saveRef.current = { plate, form, vehicleModel, commercialValue, cityName, cotSaved }

  // Guardar cotizacion con planes reales (llamado al final de fetchQuotes)
  async function saveCotizacionWithPlans(allFull, allBasic) {
    const s = saveRef.current
    const allQuotes = [...allFull, ...allBasic]
    // Solo guardar si hay al menos 1 plan con precio — nunca cotizaciones vacías
    if (s.cotSaved || !s.plate || allQuotes.length === 0) return
    try {
      const nombre = `${s.form.nombre} ${s.form.apellido}`.trim() || null
      const body = {
        placa: s.plate,
        vehicleModel: s.vehicleModel,
        comercial_value: s.commercialValue,
        cliente_nombre: nombre,
        cliente_telefono: s.form.celular || null,
        cliente_correo: s.form.correo || null,
        cliente_cedula: s.form.numDoc || null,
        cliente_tipo_doc: s.form.tipoDoc || null,
        datos_cotizacion: {
          form_full: { ...s.form, cityName: s.cityName },
          commercial_value: s.commercialValue,
          quotes: allQuotes.map(p => ({
            insuranceCode: p.insuranceCode,
            carrierId: p.carrierId,
            company: p.company,
            logo: p.logo,
            price: p.price,
            productFull: p.productFull,
            coverages: p.coverages || [...(p.main||[]), ...(p.extras||[])],
            main: p.main || [],
          })),
          mejor_precio: allQuotes.length > 0 ? Math.min(...allQuotes.map(p => p.price)) : null,
        },
      }
      const r = await fetch(`${API}/api/cotizar/guardar`, {
        method: 'POST',
        headers: { Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (d.id) cotizacionIdRef.current = d.id
      saveRef.current.cotSaved = true
      setCotSaved(true)
    } catch {}
  }

  // No guardar al salir — solo se guarda cuando todos los precios llegan (saveCotizacionWithPlans)

  function handleElegir(plan) {
    setPendingPlan(plan)
    setShowReminder(true)
  }

  function confirmElegir() {
    setSelectedPlan(pendingPlan)
    setShowReminder(false)
    setPendingPlan(null)
    setPhase('emitir')
    setSendErr('')
  }

  async function handleEmitir(e) {
    e.preventDefault()
    if (!cedulaFile || !tarjetaFile) { setSendErr('Debes adjuntar ambos documentos.'); return }
    setSending(true); setSendErr('')
    const birthDate = `${form.anioNac}-${String(form.mesNac).padStart(2,'0')}-${String(form.diaNac).padStart(2,'0')}`
    const fd = new FormData()
    fd.append('formData', JSON.stringify({
      documentTypeId: form.tipoDoc,           // backend normaliza a número (CC→1, CE→2, etc.)
      identification: form.numDoc,
      firstName:      form.nombre,
      lastName:       form.apellido,
      birthDate,
      plate,
      municipalityId: form.ciudad,
      mobileNumber:   form.celular,
      genderId:       form.gender==='M' ? 1 : 2,
      gender:         form.gender,
      email:          form.correo,
      city:           cityName,
      vehicleModel,
      vehicleYear:    vehicleModel || null,    // año del vehículo
      commercialValue: commercialValue || null,
    }))
    fd.append('poliza', JSON.stringify({
      insuranceCode: selectedPlan.insuranceCode || selectedPlan.carrierId,
      company: selectedPlan.company,
      price:   selectedPlan.price,
      productFull: selectedPlan.productFull,
      main:    selectedPlan.main,
    }))
    fd.append('aliado_nombre', `${user?.nombre||''} ${user?.apellido||''}`.trim() || user?.email || '')
    if (cotizacionIdRef.current) fd.append('cotizacion_id', String(cotizacionIdRef.current))
    fd.append('cedula_titular',    cedulaFile)
    fd.append('tarjeta_propiedad', tarjetaFile)
    try {
      const r = await fetch(`${API}/api/cotizar/emitir`, {
        method:'POST', headers:{ Authorization:`Bearer ${getToken()}` },
        body: fd, credentials:'include',
      })
      const data = await r.json()
      if (!r.ok) { setSendErr(data.message || 'Error al enviar el lead.'); return }
      setPhase('done')
    } catch { setSendErr('No se pudo conectar con el servidor.') }
    finally { setSending(false) }
  }

  function reset() {
    quotesLoadedRef.current = false
    saveRef.current.cotSaved = false
    cotizacionIdRef.current = null
    setPhase('placa'); setPlate(''); setStep(1)
    setFullPlans([]); setBasicPlans([]); setSelectedPlan(null)
    setCedulaFile(null); setTarjetaFile(null); setSendErr('')
    setVehicleModel(''); setCommercialValue(null)
    setForm({ nombre:'', apellido:'', gender:'', tipoDoc:'CC', numDoc:'', diaNac:'', mesNac:'', anioNac:'', correo:'', ciudad:'', celular:'' })
    navigate('/dashboard')
  }

  const step1Ok = form.nombre.trim().length>=2 && form.apellido.trim().length>=2 && !!form.gender
  const step2Ok = form.numDoc.trim().length>=5 && !!(form.diaNac && form.mesNac && form.anioNac)
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)
  const celOk   = form.celular.replace(/\D/g,'').length === 10
  const step3Ok = emailOk && !!form.ciudad && celOk

  /* ── SELECT ── */
  if (phase === 'select') return (
    <div className="cotizar-select-wrap" style={{
      height:'100%', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      paddingTop:48, paddingLeft:24, paddingRight:24, paddingBottom:24,
      background:'#f4f5fb', overflow:'hidden',
    }}>
      {/* Header */}
      <div className="cotizar-select-hdr" style={{ textAlign:'center', marginBottom:32 }}>
        <h1 className="cotizar-select-h1" style={{ fontFamily:'Poppins', fontSize:24, fontWeight:800, color:'#111827', margin:'0 0 12px' }}>
          ¿Qué tipo de vehículo quieres cotizar?
        </h1>
        <div style={{ width:40, height:3, background:'#5745AB', borderRadius:99, margin:'0 auto' }} />
      </div>

      {/* Cards */}
      <div className="cotizar-select-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, width:'100%', maxWidth:600 }}>

        {/* ── Vehículo usado ── */}
        <button
          className="cotizar-select-card"
          onClick={() => setPhase('placa')}
          onMouseEnter={() => setUsadoHov(true)}
          onMouseLeave={() => setUsadoHov(false)}
          style={{
            background:'#fff',
            border: usadoHov ? '2px solid #5745AB' : '2px solid #e8eaf0',
            borderRadius:20, padding:'28px 24px 72px', cursor:'pointer',
            textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', position:'relative',
            boxShadow: usadoHov ? '0 8px 32px rgba(87,69,171,0.14)' : '0 2px 8px rgba(0,0,0,0.04)',
            transition:'border-color 0.18s, box-shadow 0.18s',
          }}
        >
          <div className="cotizar-card-img-wrap" style={{
            width:148, height:148, borderRadius:'50%',
            background: usadoHov ? '#EEE7FD' : '#f0f2f8',
            display:'flex', alignItems:'center', justifyContent:'center',
            marginBottom:20, overflow:'hidden',
            transition:'background 0.18s',
          }}>
            <img
              className="cotizar-card-img"
              src={cotizarplacaImg}
              alt="Vehículo usado"
              style={{
                width:148, height:148, objectFit:'cover',
                filter: usadoHov ? 'none' : 'grayscale(1)',
                transition:'filter 0.18s',
              }}
            />
          </div>
          <div className="cotizar-card-txt">
            <p style={{ margin:'0 0 4px', fontFamily:'Poppins', fontSize:16, fontWeight:700, color:'#111827' }}>
              Vehículo usado
            </p>
            <p style={{ margin:0, fontFamily:'Inter', fontSize:13, color:'#6b7280' }}>
              Solo con la placa.
            </p>
          </div>
          <div className="cotizar-card-arrow" style={{
            position:'absolute', bottom:22, right:22, width:42, height:42,
            borderRadius:'50%',
            background: usadoHov ? '#5745AB' : '#e8eaf0',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'background 0.18s',
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke={usadoHov ? '#fff' : '#9ca3af'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>

        {/* ── Vehículo 0 km ── */}
        <div className="cotizar-select-card" style={{
          background:'#fff', border:'2px solid #e8eaf0', borderRadius:20,
          padding:'28px 24px 72px', cursor:'not-allowed', textAlign:'center',
          display:'flex', flexDirection:'column', alignItems:'center', position:'relative',
          boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div className="cotizar-card-img-wrap" style={{
            width:148, height:148, borderRadius:'50%', background:'#f0f2f8',
            display:'flex', alignItems:'center', justifyContent:'center',
            marginBottom:20, overflow:'hidden',
          }}>
            <img
              className="cotizar-card-img"
              src={cotizar0kmImg}
              alt="Vehículo 0 km"
              style={{ width:148, height:148, objectFit:'cover', filter:'grayscale(1)' }}
            />
          </div>
          <div className="cotizar-card-txt">
            <p style={{ margin:'0 0 4px', fontFamily:'Poppins', fontSize:16, fontWeight:700, color:'#374151' }}>
              Vehículo 0 km
            </p>
            <p style={{ margin:0, fontFamily:'Inter', fontSize:13, color:'#9ca3af' }}>
              Sin placa requerida.
            </p>
          </div>
          <div className="cotizar-card-arrow" style={{
            position:'absolute', bottom:22, right:22, width:42, height:42,
            borderRadius:'50%', background:'#e8eaf0',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="#9ca3af" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

      </div>
    </div>
  )

  /* ── PLACA ── */
  if (phase === 'placa') return (
    <div style={{ padding:'0 24px 32px', maxWidth:'72rem', margin:'0 auto' }}>
      <div style={{ paddingTop:8, marginBottom:20 }}>
        <button onClick={() => setPhase('select')} style={{ fontFamily:'Inter', fontSize:13, color:'#9ca3af', background:'none', border:'none', cursor:'pointer', padding:0, marginBottom:10, display:'block' }}>← Volver</button>
        <h1 style={{ fontFamily:'Poppins', fontSize:22, fontWeight:700, color:'#111827', margin:'0 0 4px' }}>Nueva cotización</h1>
        <p style={{ fontFamily:'Inter', fontSize:13, color:'#9ca3af', margin:0 }}>Ingresa la placa del vehículo del cliente para empezar.</p>
      </div>
      <div style={card}>
        <div style={{ fontSize:12,fontWeight:600,color:'#374151',marginBottom:8 }}>Placa del vehículo</div>
        <div style={{ display:'flex',alignItems:'center',gap:12,background:'#f9fafb',border:`2px solid ${isValidPlate(plate)?'#2D2A7A':'#e5e7eb'}`,borderRadius:14,padding:'14px 18px',marginBottom:8,transition:'border-color 0.2s' }}>
          <span style={{ background:'#2D2A7A',color:'#fff',fontSize:11,fontWeight:800,padding:'3px 8px',borderRadius:6,letterSpacing:'0.05em' }}>CO</span>
          <input value={displayPlate(plate)} onChange={e => setPlate(formatPlate(e.target.value))}
            placeholder="ABC 123" maxLength={7} autoFocus
            style={{ flex:1,border:'none',background:'transparent',fontSize:26,fontWeight:800,color:'#111827',letterSpacing:'0.1em',outline:'none' }} />
        </div>
        {plate.length>0 && !isValidPlate(plate) && (
          <p style={{ color:'#dc2626',fontSize:12,marginBottom:8 }}>Formato: 3 letras y 3 números (ej. ABC 123)</p>
        )}
        <button onClick={handlePlateConfirm} disabled={!isValidPlate(plate)}
          style={{ ...btnP(!isValidPlate(plate)), width:'100%',marginTop:12 }}>
          Continuar con los datos del cliente →
        </button>
      </div>
    </div>
  )

  /* ── FORM ── */
  if (phase === 'form') return (
    <div className="p-6 lg:p-8" style={{ height:'100%', overflowY:'auto' }}>
      <div className="max-w-5xl mx-auto">
      {/* Pill placa */}
      <div style={{ display:'flex',alignItems:'center',gap:10,maxWidth:520,margin:'0 auto 16px' }}>
        <span style={{ display:'flex',alignItems:'center',gap:8,background:'#edeef3',borderRadius:99,padding:'6px 14px',fontSize:13,fontWeight:700,color:'#2D2A7A' }}>
          <span style={{ background:'#2D2A7A',color:'#fff',fontSize:10,padding:'2px 6px',borderRadius:4 }}>CO</span>
          {displayPlate(plate)}
        </span>
        <button onClick={() => setPhase('placa')} style={{ fontSize:12,color:'#9ca3af',background:'none',border:'none',cursor:'pointer' }}>Cambiar</button>
      </div>

      {/* Stepper */}
      <div style={{ display:'flex',alignItems:'center',maxWidth:520,margin:'0 auto 20px',gap:0 }}>
        {[{n:1,l:'Sobre el cliente'},{n:2,l:'Documento'},{n:3,l:'Contacto'}].map((s,i) => (
          <Fragment key={s.n}>
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',cursor:step>s.n?'pointer':'default' }}
              onClick={() => step>s.n && setStep(s.n)}>
              <div style={{ width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                background: step>=s.n ? '#2D2A7A' : '#e5e7eb',
                color: step>=s.n ? '#fff' : '#9ca3af', fontSize:12,fontWeight:700 }}>
                {step>s.n ? '✓' : s.n}
              </div>
              <span style={{ fontSize:10,marginTop:4,color:step===s.n?'#2D2A7A':'#9ca3af',fontWeight:step===s.n?700:400 }}>{s.l}</span>
            </div>
            {i<2 && <div style={{ flex:1,height:2,background:step>s.n?'#2D2A7A':'#e5e7eb',margin:'0 4px',marginBottom:18 }} />}
          </Fragment>
        ))}
      </div>

      <div style={card}>
        {step===1 && <>
          <h2 style={{ fontSize:17,fontWeight:800,color:'#111827',marginBottom:20 }}>Datos del cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Fld label="Nombre *"><Inp value={form.nombre} onChange={v=>setF('nombre',v)} placeholder="Nombre" /></Fld>
            <Fld label="Apellido *"><Inp value={form.apellido} onChange={v=>setF('apellido',v)} placeholder="Apellido" /></Fld>
          </div>
          <Fld label="Género *"><Sel value={form.gender} onChange={v=>setF('gender',v)} options={GENDER_OPTIONS} placeholder="Selecciona..." /></Fld>
          <button onClick={() => setStep(2)} disabled={!step1Ok} style={{ ...btnP(!step1Ok),width:'100%',marginTop:8 }}>Continuar →</button>
        </>}

        {step===2 && <>
          <h2 style={{ fontSize:17,fontWeight:800,color:'#111827',marginBottom:20 }}>Documento del cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Fld label="Tipo de documento *"><Sel value={form.tipoDoc} onChange={v=>setF('tipoDoc',v)} options={DOC_OPTIONS} /></Fld>
            <Fld label="Número *"><Inp value={form.numDoc} onChange={v=>setF('numDoc',v.replace(/\D/g,''))} placeholder="Ej. 1023456789" /></Fld>
          </div>
          <Fld label="Fecha de nacimiento *">
            <div className="grid grid-cols-3 gap-2">
              <Sel value={form.diaNac} onChange={v=>setF('diaNac',v)} options={DAY_OPTIONS} placeholder="Día" />
              <Sel value={form.mesNac} onChange={v=>setF('mesNac',v)} options={MONTH_OPTIONS} placeholder="Mes" />
              <Sel value={form.anioNac} onChange={v=>setF('anioNac',v)} options={YEAR_OPTIONS} placeholder="Año" />
            </div>
          </Fld>
          <div style={{ display:'flex',gap:10,marginTop:8 }}>
            <button onClick={() => setStep(1)} style={btnS}>← Atrás</button>
            <button onClick={() => setStep(3)} disabled={!step2Ok} style={{ ...btnP(!step2Ok),flex:1 }}>Continuar →</button>
          </div>
        </>}

        {step===3 && <>
          <h2 style={{ fontSize:17,fontWeight:800,color:'#111827',marginBottom:20 }}>Contacto del cliente</h2>
          <Fld label="Correo electrónico *">
            <Inp type="email" value={form.correo} onChange={v=>setF('correo',v)} placeholder="correo@ejemplo.com" />
            {form.correo && !emailOk && <p style={{ color:'#dc2626',fontSize:11,margin:'4px 0 0' }}>Ingresa un correo válido</p>}
          </Fld>
          <Fld label="Ciudad donde circula el vehículo *">
            <ComboBox
              value={form.ciudad}
              onChange={v => { setF('ciudad',v); const c=cities.find(x=>String(x.id)===v); setCityName(c?`${c.name} (${c.departmentName})`:'') }}
              options={cities.map(c => ({ v:String(c.id), label:`${c.name} (${c.departmentName})` }))}
              placeholder="Escribe o selecciona ciudad..."
            />
          </Fld>
          <Fld label="Celular del cliente (10 dígitos) *">
            <Inp type="tel" value={form.celular} onChange={v=>setF('celular',v.replace(/\D/g,'').slice(0,10))} placeholder="Ej. 3001234567" />
            {form.celular && !celOk && <p style={{ color:'#dc2626',fontSize:11,margin:'4px 0 0' }}>El celular debe tener exactamente 10 dígitos</p>}
          </Fld>
          <div style={{ display:'flex',gap:10,marginTop:8 }}>
            <button onClick={() => setStep(2)} style={btnS}>← Atrás</button>
            <button onClick={() => setPhase('results')} disabled={!step3Ok} style={{ ...btnP(!step3Ok),flex:1 }}>Ver cotizaciones →</button>
          </div>
        </>}
      </div>
      </div>
    </div>
  )

  /* ── RESULTS ── */
  if (phase === 'results') {
    const allPlans = [...fullPlans, ...basicPlans]
    return (
      <div className="p-6 lg:p-8" style={{ height:'100%', overflowY:'auto' }}>
        <div className="max-w-5xl mx-auto">
        {/* Topbar */}
        <div style={{ background:'#2D2A7A',borderRadius:14,padding:'14px 20px',display:'flex',alignItems:'center',gap:16,marginBottom:20,flexWrap:'wrap' }}>
          <span style={{ color:'#fff',fontWeight:800,fontSize:14 }}>{displayPlate(plate)}</span>
          <span style={{ color:'#a5b4fc',fontSize:13 }}>{form.nombre} {form.apellido}</span>
          {commercialValue != null && commercialValue > 0 && (
            <span style={{ color:'#fde68a',fontSize:13,fontWeight:600 }}>
              Valor asegurado: {fmt(commercialValue)}
            </span>
          )}
          {!loadingQ && allPlans.length>0 && <>
            <span style={{ color:'#a5b4fc',fontSize:13 }}>· {allPlans.length} planes</span>
            <span style={{ color:'#86efac',fontSize:13 }}>Mejor precio: {fmt(Math.min(...allPlans.map(p=>p.price)))}</span>
          </>}
          <button onClick={() => setPhase('form')} style={{ marginLeft:'auto',fontSize:12,color:'#a5b4fc',background:'none',border:'1px solid rgba(255,255,255,0.3)',borderRadius:99,padding:'4px 12px',cursor:'pointer' }}>← Editar datos</button>
        </div>


        {/* Cerrar cotización */}
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
          <button
            onClick={() => reset()}
            style={{ fontSize:12, color:'#dc2626', background:'#fef2f2', border:'1.5px solid #fecaca',
                     borderRadius:99, padding:'7px 16px', cursor:'pointer', fontWeight:700,
                     display:'flex', alignItems:'center', gap:6, transition:'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background='#fee2e2'}
            onMouseLeave={e => e.currentTarget.style.background='#fef2f2'}>
            ✕ Cerrar cotización
          </button>
        </div>

        {/* Spinner + barra de progreso mientras cargan */}
        {loadingQ && (
          <div style={{ marginBottom:16, background:'#f0f0fd', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom: progress.total > 0 ? 10 : 0 }}>
              <svg viewBox="3 3 18 18" width={20} height={20} style={{ animation:'spin 0.85s linear infinite', fill:'#2D2A7A', flexShrink:0 }}>
                <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                <path d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" opacity="0.18"/>
                <path d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"/>
              </svg>
              <div style={{ flex:1 }}>
                <span style={{ fontSize:13, fontWeight:600, color:'#2D2A7A' }}>
                  {progress.total > 0 && progress.done < progress.total
                    ? `Consultando aseguradoras... ${progress.done} de ${progress.total} respondidas`
                    : progress.total > 0 && progress.done === progress.total
                    ? `Procesando cotizaciones finales...`
                    : 'Consultando aseguradoras...'}
                </span>
                <p style={{ margin:'1px 0 0', fontSize:11, color:'#6b7280' }}>
                  El cargador desaparecerá al recibir todas las respuestas
                </p>
              </div>
            </div>
            {progress.total > 0 && (
              <div style={{ background:'#c7c5f5',borderRadius:99,height:5,overflow:'hidden' }}>
                <div style={{ height:'100%',background:'#2D2A7A',borderRadius:99,
                              width:`${(progress.done/progress.total)*100}%`,transition:'width 0.4s ease' }} />
              </div>
            )}
          </div>
        )}
        {!loadingQ && fetchErr && <p style={{ color:'#dc2626',fontSize:13,marginBottom:16 }}>{fetchErr}</p>}

        {/* Placeholder mientras no hay resultados aún */}
        {loadingQ && fullPlans.length===0 && basicPlans.length===0 && (
          <div style={{ background:'#fff',border:'1px solid #eeeeef',borderRadius:14,padding:'48px 24px',textAlign:'center' }}>
            <p style={{ color:'#9ca3af',fontSize:14,margin:0 }}>Los resultados aparecerán aquí en cuanto cada aseguradora responda</p>
          </div>
        )}

        {/* Planes Full */}
        {fullPlans.length>0 && <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
            <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <h2 style={{ fontSize:15,fontWeight:800,color:'#111827',margin:0 }}>Planes Completos (Full)</h2>
                <PlanTipoTooltip tipo="full" />
              </div>
              <p style={{ fontSize:12,color:'#9ca3af',margin:0 }}>Todo riesgo: daños propios, hurto, cristales y más</p>
            </div>
            <span style={{ background:'#ede9fe',color:'#7c3aed',fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:99 }}>{fullPlans.length} opciones</span>
          </div>
          {(() => {
            const bestPrice = Math.min(...fullPlans.map(p => p.price))
            return fullPlans.map(p => <PlanCard key={p.id} plan={p} onElegir={handleElegir} isBest={p.price === bestPrice} />)
          })()}
        </div>}

        {/* Planes Básicos */}
        {basicPlans.length>0 && <div>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
            <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <h2 style={{ fontSize:15,fontWeight:800,color:'#111827',margin:0 }}>Planes Básicos</h2>
                <PlanTipoTooltip tipo="basico" />
              </div>
              <p style={{ fontSize:12,color:'#9ca3af',margin:0 }}>RC ante terceros y pérdida total — menor costo</p>
            </div>
            <span style={{ background:'#dbeafe',color:'#1d4ed8',fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:99 }}>{basicPlans.length} opciones</span>
          </div>
          {(() => {
            const bestPrice = Math.min(...basicPlans.map(p => p.price))
            return basicPlans.map(p => <PlanCard key={p.id} plan={p} onElegir={handleElegir} isBest={p.price === bestPrice} />)
          })()}
        </div>}

        {!loadingQ && allPlans.length===0 && !fetchErr && (
          <p style={{ textAlign:'center',color:'#9ca3af',fontSize:14,padding:'40px 0' }}>No se encontraron cotizaciones. Verifica los datos del cliente e intenta de nuevo.</p>
        )}

        {/* Reminder modal before going to emitir */}
        {showReminder && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:500,
                        display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'#fff', borderRadius:20, padding:'28px 24px', maxWidth:400, width:'100%' }}>
              <div style={{ fontSize:36, textAlign:'center', marginBottom:12 }}>📋</div>
              <h3 style={{ fontSize:18, fontWeight:800, color:'#111827', textAlign:'center', marginBottom:8 }}>
                Para emitir necesitas
              </h3>
              <p style={{ fontSize:13, color:'#6b7280', textAlign:'center', marginBottom:20, lineHeight:1.6 }}>
                Para enviar esta póliza a Asegura2.com necesitarás adjuntar:
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
                {['📄 Cédula del titular del vehículo (PDF o imagen)', '🚗 Tarjeta de propiedad del vehículo (PDF o imagen)'].map(item => (
                  <div key={item} style={{ background:'#f0f0fd', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#2D2A7A', fontWeight:600 }}>{item}</div>
                ))}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => { setShowReminder(false); setPendingPlan(null) }}
                  style={{ flex:1, background:'none', border:'1.5px solid #e5e7eb', borderRadius:99, padding:'11px 0', fontSize:14, fontWeight:600, cursor:'pointer', color:'#374151' }}>
                  Cancelar
                </button>
                <button onClick={confirmElegir}
                  style={{ flex:1, background:'#2D2A7A', color:'#fff', border:'none', borderRadius:99, padding:'11px 0', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  Continuar →
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    )
  }

  /* ── EMITIR ── */
  if (phase === 'emitir') return (
    <div className="p-6 lg:p-8" style={{ height:'100%', overflowY:'auto' }}>
      <div className="max-w-5xl mx-auto">
      <div style={{ maxWidth:540, margin:'0 auto' }}>
        <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:20 }}>
          <button onClick={() => setPhase('results')} style={{ fontSize:13,color:'#6b7280',background:'none',border:'none',cursor:'pointer' }}>← Volver</button>
          <h1 style={{ fontSize:20,fontWeight:800,color:'#111827',margin:0 }}>Emitir lead</h1>
        </div>

        {/* Plan elegido */}
        <div style={{ background:'#ede9fe',border:'1.5px solid #c4b5fd',borderRadius:14,padding:'16px 20px',marginBottom:16 }}>
          <div style={{ fontSize:11,fontWeight:700,color:'#7c3aed',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6 }}>Plan seleccionado</div>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:800,fontSize:16,color:'#111827' }}>{selectedPlan?.company}</div>
              <div style={{ fontSize:12,color:'#6b7280',marginTop:2 }}>{selectedPlan?.productFull?'Plan Full':'Plan Básico'} · {selectedPlan?.main?.join(' · ')}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:22,fontWeight:800,color:'#2D2A7A' }}>{fmt(selectedPlan?.price||0)}</div>
              <div style={{ fontSize:11,color:'#9ca3af' }}>prima anual</div>
            </div>
          </div>
        </div>

        {/* Cliente */}
        <div style={{ background:'#f9fafb',borderRadius:12,padding:'12px 16px',marginBottom:16,fontSize:13 }}>
          <span style={{ fontWeight:700,color:'#374151' }}>{form.nombre} {form.apellido}</span>
          <span style={{ color:'#9ca3af' }}> · Placa: </span>
          <span style={{ fontWeight:700,color:'#374151' }}>{displayPlate(plate)}</span>
          <span style={{ color:'#9ca3af' }}> · {form.correo} · {form.celular}</span>
        </div>

        {/* Documentos */}
        <form onSubmit={handleEmitir} style={card}>
          <h2 style={{ fontSize:16,fontWeight:800,color:'#111827',marginBottom:4 }}>Documentos requeridos</h2>
          <p style={{ fontSize:13,color:'#9ca3af',marginBottom:20 }}>Adjunta los documentos del cliente en PDF o imagen.</p>

          <DragDropFile label="Cédula del titular *" file={cedulaFile} onChange={setCedulaFile} />
          <DragDropFile label="Tarjeta de propiedad *" file={tarjetaFile} onChange={setTarjetaFile} />

          {sendErr && <p style={{ color:'#dc2626',fontSize:13,marginBottom:12 }}>{sendErr}</p>}
          <button type="submit" disabled={sending || !cedulaFile || !tarjetaFile}
            style={{ ...btnP(sending || !cedulaFile || !tarjetaFile),width:'100%' }}>
            {sending ? 'Enviando...' : '🚀 Enviar lead a Asegura2.com'}
          </button>
          <p style={{ fontSize:11,color:'#9ca3af',marginTop:10,textAlign:'center' }}>
            Nuestro equipo contactará al cliente y te avisaremos por correo cuando esté en proceso.
          </p>
        </form>
      </div>
      </div>
    </div>
  )

  /* ── DONE ── */
  return (
    <div className="p-6 lg:p-8" style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%' }}>
      <div style={{ ...card,textAlign:'center',maxWidth:440 }}>
        <div style={{ fontSize:64,marginBottom:16 }}>🎉</div>
        <h2 style={{ fontSize:22,fontWeight:800,color:'#111827',marginBottom:10 }}>¡Lead enviado!</h2>
        <p style={{ fontSize:14,color:'#6b7280',lineHeight:1.7,marginBottom:28 }}>
          Recibimos la solicitud para <strong>{form.nombre} {form.apellido}</strong> — placa <strong>{displayPlate(plate)}</strong>.<br /><br />
          Nuestro equipo contactará al cliente. Podrás ver el estado en <em>Mis pólizas</em> y te avisaremos por correo cuando esté en proceso.
        </p>
        <button onClick={reset} style={{ ...btnP(),padding:'12px 28px' }}>Nueva cotización</button>
      </div>
    </div>
  )
}
