import { useState, useEffect, Fragment } from 'react'
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
  { keys:['allianz'],           name:'Allianz',           logo:'/logos/allianz.png'   },
  { keys:['axa','colpatria'],   name:'AXA Colpatria',     logo:'/logos/axa.png'       },
  { keys:['bolívar','bolivar'], name:'Seguros Bolívar',   logo:'/logos/bolivar.png'   },
  { keys:['equidad'],           name:'La Equidad',        logo:'/logos/equidad.png'   },
  { keys:['hdi'],               name:'HDI Seguros',       logo:'/logos/hdi.png'       },
  { keys:['mapfre'],            name:'Mapfre',            logo:'/logos/mapfre.png'    },
  { keys:['sbs'],               name:'SBS Seguros',       logo:'/logos/sbs.png'       },
  { keys:['solidaria'],         name:'Seguros Solidaria', logo:'/logos/solidaria.png' },
  { keys:['sura'],              name:'Sura',              logo:'/logos/sura.png'      },
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
    main: coverages.slice(0,3), extras: coverages.slice(3),
    productFull: resp.productFull === true || (resp.insuranceCarrier||'').toLowerCase().includes('hdi'),
    raw: resp,
  }
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

function PlanCard({ plan, onElegir }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:14, overflow:'hidden', marginBottom:10, transition:'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(45,42,122,0.12)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
      <div style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px' }}>
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
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:14, color:'#111827', marginBottom:4 }}>{plan.company}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 12px' }}>
            {plan.main.map((item,i) => (
              <span key={i} style={{ fontSize:12, color:'#6b7280', display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ color:'#2D2A7A', fontWeight:700 }}>✓</span> {item}
              </span>
            ))}
          </div>
          {plan.extras.length > 0 && (
            <button onClick={() => setOpen(v=>!v)}
              style={{ fontSize:11, color:'#2D2A7A', background:'none', border:'none', cursor:'pointer', padding:0, marginTop:4, fontWeight:600 }}>
              {open ? '↑ Ocultar' : `↓ +${plan.extras.length} coberturas`}
            </button>
          )}
        </div>
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
      {open && plan.extras.length > 0 && (
        <div style={{ padding:'0 20px 16px', display:'flex', flexWrap:'wrap', gap:'4px 16px', borderTop:'1px solid #f3f4f6' }}>
          {plan.extras.map((item,i) => (
            <span key={i} style={{ fontSize:12, color:'#6b7280', display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ color:'#16a34a' }}>✓</span> {item}
            </span>
          ))}
        </div>
      )}
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
  const [phase, setPhase] = useState('placa')
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

  const authH = { Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json' }

  // Cargar ciudades
  useEffect(() => {
    fetch(`${API}/api/cotizar/municipios`, { headers: authH })
      .then(r => r.json())
      .then(d => setCities(d?.response || d?.data?.response || []))
      .catch(() => {})
  }, [])

  // Confirmar placa → pedir datos fasecolda
  function handlePlateConfirm() {
    fetch(`${API}/api/cotizar/fasecolda`, {
      method:'POST', headers: authH,
      body: JSON.stringify({ Placa: plate.toUpperCase(), Modelo:'' }),
    })
      .then(r => r.json())
      .then(d => {
        const info = d?.response
        if (info?.modelo) setVehicleModel(/(\d{4})/.exec(info.modelo)?.[1] || info.modelo)
        if (info?.valorAsegurado) setCommercialValue(info.valorAsegurado)
      })
      .catch(() => {})
    setPhase('form'); setStep(1)
  }

  // Cotizaciones — espera a que TODAS respondan o hasta timeout de 25s
  async function fetchQuotes() {
    setLoadingQ(true); setFetchErr(''); setFullPlans([]); setBasicPlans([])
    setProgress({ done:0, total:0 })

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

    const collected = { full: [], basic: [], cvValue: null }

    try {
      const provR = await fetch(`${API}/api/cotizar/proveedores`, { headers: authH })
      const provD = await provR.json()
      const providers = provD?.response || provD?.data?.response || []
      if (!providers.length) { setFetchErr('No se encontraron proveedores.'); return }
      setProgress({ done:0, total: providers.length })

      let done = 0

      // Timeout de 25 segundos para proveedores lentos
      const TIMEOUT = 25000
      const withTimeout = (p) =>
        Promise.race([p, new Promise(resolve => setTimeout(resolve, TIMEOUT))])

      await Promise.allSettled(
        providers.map(provider =>
          withTimeout(
            fetch(`${API}/api/cotizar/quote`, {
              method:'POST', headers: authH,
              body: JSON.stringify({ ...model, provider }),
            })
              .then(r => r.json())
              .then(d => {
                const resp = d?.response
                const price = parseFloat(resp?.yearlyTotal || resp?.monthlyTotal || 0)
                if (resp && !resp.error && price > 0) {
                  const plan = mapPlan(resp)
                  if (plan.company !== 'Seguros del Estado') {
                    if (resp?.commercialValue) collected.cvValue = resp.commercialValue
                    if (plan.productFull) collected.full.push(plan)
                    else collected.basic.push(plan)
                  }
                }
              })
              .catch(() => {})
              .finally(() => { done++; setProgress({ done, total: providers.length }) })
          )
        )
      )

      // Una vez completadas TODAS, ordenamos y mostramos
      if (collected.cvValue) setCommercialValue(collected.cvValue)
      setFullPlans([...collected.full].sort((a,b) => a.price-b.price))
      setBasicPlans([...collected.basic].sort((a,b) => a.price-b.price))

      if (!collected.full.length && !collected.basic.length) {
        setFetchErr('No se encontraron cotizaciones. Verifica los datos del cliente.')
      }
    } catch {
      setFetchErr('No se pudieron obtener cotizaciones. Intenta nuevamente.')
    } finally {
      setLoadingQ(false)
    }
  }

  useEffect(() => {
    if (phase === 'results') fetchQuotes()
  }, [phase])

  function handleElegir(plan) { setSelectedPlan(plan); setPhase('emitir'); setSendErr('') }

  async function handleEmitir(e) {
    e.preventDefault()
    if (!cedulaFile || !tarjetaFile) { setSendErr('Debes adjuntar ambos documentos.'); return }
    setSending(true); setSendErr('')
    const birthDate = `${form.anioNac}-${String(form.mesNac).padStart(2,'0')}-${String(form.diaNac).padStart(2,'0')}`
    const fd = new FormData()
    fd.append('formData', JSON.stringify({
      documentTypeId: form.tipoDoc, identification: form.numDoc,
      firstName: form.nombre,       lastName: form.apellido,
      birthDate, plate,             municipalityId: form.ciudad,
      mobileNumber: form.celular,   genderId: form.gender==='M' ? 1 : 2,
      gender: form.gender,          email: form.correo,
      city: cityName,               vehicleModel, commercialValue,
    }))
    fd.append('poliza', JSON.stringify({
      insuranceCode: selectedPlan.insuranceCode || selectedPlan.carrierId,
      company: selectedPlan.company,
      price:   selectedPlan.price,
      productFull: selectedPlan.productFull,
      main:    selectedPlan.main,
    }))
    fd.append('aliado_nombre', `${user?.nombre||''} ${user?.apellido||''}`.trim() || user?.email || '')
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
    setPhase('placa'); setPlate(''); setStep(1)
    setFullPlans([]); setBasicPlans([]); setSelectedPlan(null)
    setCedulaFile(null); setTarjetaFile(null); setSendErr('')
    setVehicleModel(''); setCommercialValue(null)
    setForm({ nombre:'', apellido:'', gender:'', tipoDoc:'CC', numDoc:'', diaNac:'', mesNac:'', anioNac:'', correo:'', ciudad:'', celular:'' })
  }

  const step1Ok = form.nombre.trim().length>=2 && form.apellido.trim().length>=2 && !!form.gender
  const step2Ok = form.numDoc.trim().length>=5 && !!(form.diaNac && form.mesNac && form.anioNac)
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)
  const celOk   = form.celular.replace(/\D/g,'').length === 10
  const step3Ok = emailOk && !!form.ciudad && celOk

  /* ── PLACA ── */
  if (phase === 'placa') return (
    <div style={{ padding:'24px', height:'100%', overflowY:'auto' }}>
      <h1 style={{ fontSize:22,fontWeight:800,color:'#111827',marginBottom:4 }}>Nueva cotización</h1>
      <p style={{ fontSize:13,color:'#6b7280',marginBottom:24 }}>Ingresa la placa del vehículo del cliente para empezar.</p>
      <div style={card}>
        <div style={{ fontSize:12,fontWeight:600,color:'#374151',marginBottom:8 }}>Placa del vehículo</div>
        <div style={{ display:'flex',alignItems:'center',gap:12,background:'#f9fafb',border:`2px solid ${isValidPlate(plate)?'#2D2A7A':'#e5e7eb'}`,borderRadius:14,padding:'14px 18px',marginBottom:8,transition:'border-color 0.2s' }}>
          <span style={{ background:'#2D2A7A',color:'#fff',fontSize:11,fontWeight:800,padding:'3px 8px',borderRadius:6,letterSpacing:'0.05em' }}>CO</span>
          <input value={displayPlate(plate)} onChange={e => setPlate(formatPlate(e.target.value))}
            placeholder="ABC 123" maxLength={7} autoFocus
            style={{ flex:1,border:'none',background:'transparent',fontSize:26,fontWeight:800,color:'#111827',letterSpacing:'0.1em',outline:'none' }} />
          {isValidPlate(plate) && <span style={{ color:'#16a34a',fontSize:20 }}>✓</span>}
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
    <div style={{ padding:'24px', height:'100%', overflowY:'auto' }}>
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
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <Fld label="Nombre *"><Inp value={form.nombre} onChange={v=>setF('nombre',v)} placeholder="Nombre" /></Fld>
            <Fld label="Apellido *"><Inp value={form.apellido} onChange={v=>setF('apellido',v)} placeholder="Apellido" /></Fld>
          </div>
          <Fld label="Género *"><Sel value={form.gender} onChange={v=>setF('gender',v)} options={GENDER_OPTIONS} placeholder="Selecciona..." /></Fld>
          <button onClick={() => setStep(2)} disabled={!step1Ok} style={{ ...btnP(!step1Ok),width:'100%',marginTop:8 }}>Continuar →</button>
        </>}

        {step===2 && <>
          <h2 style={{ fontSize:17,fontWeight:800,color:'#111827',marginBottom:20 }}>Documento del cliente</h2>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <Fld label="Tipo de documento *"><Sel value={form.tipoDoc} onChange={v=>setF('tipoDoc',v)} options={DOC_OPTIONS} /></Fld>
            <Fld label="Número *"><Inp value={form.numDoc} onChange={v=>setF('numDoc',v.replace(/\D/g,''))} placeholder="Ej. 1023456789" /></Fld>
          </div>
          <Fld label="Fecha de nacimiento *">
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8 }}>
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
  )

  /* ── RESULTS ── */
  if (phase === 'results') {
    const allPlans = [...fullPlans, ...basicPlans]
    return (
      <div style={{ padding:'24px', height:'100%', overflowY:'auto' }}>
        {/* Topbar */}
        <div style={{ background:'#2D2A7A',borderRadius:14,padding:'14px 20px',display:'flex',alignItems:'center',gap:16,marginBottom:20,flexWrap:'wrap' }}>
          <span style={{ color:'#fff',fontWeight:800,fontSize:14 }}>{displayPlate(plate)}</span>
          <span style={{ color:'#a5b4fc',fontSize:13 }}>{form.nombre} {form.apellido}</span>
          {commercialValue && (
            <span style={{ color:'#fde68a',fontSize:13,fontWeight:600 }}>
              Valor asegurado: {fmt(commercialValue)}
            </span>
          )}
          {!loadingQ && allPlans.length>0 && <>
            <span style={{ color:'#a5b4fc',fontSize:13 }}>· {allPlans.length} planes</span>
            <span style={{ color:'#86efac',fontSize:13 }}>Mejor: {fmt(Math.min(...allPlans.map(p=>p.price)))}</span>
          </>}
          <button onClick={() => setPhase('form')} style={{ marginLeft:'auto',fontSize:12,color:'#a5b4fc',background:'none',border:'1px solid rgba(255,255,255,0.3)',borderRadius:99,padding:'4px 12px',cursor:'pointer' }}>← Editar datos</button>
        </div>

        {/* Loading completo — espera todas las respuestas */}
        {loadingQ && (
          <div style={{ background:'#fff',borderRadius:16,border:'1px solid #eeeeef',padding:'40px 24px',textAlign:'center',marginBottom:16 }}>
            <div style={{ fontSize:40,marginBottom:16 }}>⏳</div>
            <p style={{ fontSize:16,fontWeight:700,color:'#111827',marginBottom:6 }}>Consultando aseguradoras...</p>
            <p style={{ fontSize:13,color:'#9ca3af',marginBottom:20 }}>Comparando precios en tiempo real. Esto puede tomar hasta 25 segundos.</p>
            {/* Barra de progreso */}
            {progress.total > 0 && (
              <>
                <div style={{ background:'#e5e7eb',borderRadius:99,height:6,marginBottom:8,overflow:'hidden',maxWidth:400,margin:'0 auto 8px' }}>
                  <div style={{ height:'100%',background:'#2D2A7A',borderRadius:99,width:`${(progress.done/progress.total)*100}%`,transition:'width 0.4s ease' }} />
                </div>
                <p style={{ fontSize:12,color:'#9ca3af' }}>{progress.done} de {progress.total} aseguradoras consultadas</p>
              </>
            )}
            {/* Logos animados */}
            <div style={{ display:'flex',justifyContent:'center',gap:16,marginTop:24,flexWrap:'wrap' }}>
              {['allianz','axa','bolivar','equidad','hdi','mapfre','sbs','solidaria','sura'].map((logo,i) => (
                <img key={logo} src={`/logos/${logo}.png`} alt={logo}
                  style={{ width:48,height:28,objectFit:'contain',opacity:0.5+Math.sin(i)*0.3,filter:'grayscale(40%)' }}
                  onError={e => e.currentTarget.style.display='none'} />
              ))}
            </div>
          </div>
        )}
        {!loadingQ && fetchErr && <p style={{ color:'#dc2626',fontSize:13,marginBottom:16 }}>{fetchErr}</p>}

        {/* Planes Full */}
        {fullPlans.length>0 && <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
            <div>
              <h2 style={{ fontSize:15,fontWeight:800,color:'#111827',margin:0 }}>Planes Full</h2>
              <p style={{ fontSize:12,color:'#9ca3af',margin:0 }}>Cobertura completa con todas las asistencias</p>
            </div>
            <span style={{ background:'#ede9fe',color:'#7c3aed',fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:99 }}>{fullPlans.length} opciones</span>
          </div>
          {fullPlans.map(p => <PlanCard key={p.id} plan={p} onElegir={handleElegir} />)}
        </div>}

        {/* Planes Básicos */}
        {basicPlans.length>0 && <div>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
            <div>
              <h2 style={{ fontSize:15,fontWeight:800,color:'#111827',margin:0 }}>Planes Básicos</h2>
              <p style={{ fontSize:12,color:'#9ca3af',margin:0 }}>Cobertura esencial al mejor precio</p>
            </div>
            <span style={{ background:'#dbeafe',color:'#1d4ed8',fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:99 }}>{basicPlans.length} opciones</span>
          </div>
          {basicPlans.map(p => <PlanCard key={p.id} plan={p} onElegir={handleElegir} />)}
        </div>}

        {!loadingQ && allPlans.length===0 && !fetchErr && (
          <p style={{ textAlign:'center',color:'#9ca3af',fontSize:14,padding:'40px 0' }}>No se encontraron cotizaciones. Verifica los datos del cliente e intenta de nuevo.</p>
        )}
      </div>
    )
  }

  /* ── EMITIR ── */
  if (phase === 'emitir') return (
    <div style={{ padding:'24px', height:'100%', overflowY:'auto' }}>
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

          {[
            { key:'cedula', label:'Cédula del titular *', file:cedulaFile, setFile:setCedulaFile },
            { key:'tarjeta', label:'Tarjeta de propiedad *', file:tarjetaFile, setFile:setTarjetaFile },
          ].map(({ key,label,file,setFile }) => (
            <div key={key} style={{ marginBottom:16 }}>
              <div style={{ fontSize:12,fontWeight:600,color:'#374151',marginBottom:6 }}>{label}</div>
              <label style={{ display:'flex',alignItems:'center',gap:12,border:`2px dashed ${file?'#2D2A7A':'#e5e7eb'}`,borderRadius:12,padding:'16px',cursor:'pointer',background:file?'#f0f0fd':'#f9fafb',transition:'all 0.2s' }}>
                <span style={{ fontSize:24 }}>{file ? '📄' : '📎'}</span>
                <span style={{ fontSize:13,color:file?'#2D2A7A':'#9ca3af',fontWeight:file?700:400 }}>
                  {file ? file.name : 'Click para adjuntar...'}
                </span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }}
                  onChange={e => setFile(e.target.files?.[0]||null)} />
              </label>
            </div>
          ))}

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
  )

  /* ── DONE ── */
  return (
    <div style={{ padding:'24px',display:'flex',alignItems:'center',justifyContent:'center',height:'100%' }}>
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
