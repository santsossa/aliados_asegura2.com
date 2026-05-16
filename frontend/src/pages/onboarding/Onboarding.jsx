import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogoFull } from '../../components/Logo'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const TIPOS_ALIADO = [
  'Asesor de concesionario',
  'Vendedor de carros usados',
  'Agente independiente',
  'Otro',
]

const BANCOS_COLOMBIA = [
  // ── Bancos tradicionales ──────────────────────────────
  'Bancolombia',
  'Banco de Bogotá',
  'Davivienda',
  'BBVA Colombia',
  'Banco de Occidente',
  'Banco Popular',
  'Banco AV Villas',
  'Banco Caja Social',
  'Scotiabank Colpatria',
  'Banco GNB Sudameris',
  'Banco Itaú',
  'Banco Falabella',
  'Banco Agrario de Colombia',
  'Banco WWB',
  'Banco Mundo Mujer',
  'Bancoomeva',
  'Banco Finandina',
  'Banco Pichincha',
  'Banco Santander de Negocios Colombia',
  'Banco Cooperativo Coopcentral',
  'Banco Serfinanza',
  'Multibank',
  // ── Billeteras y neobancos ────────────────────────────
  'Nequi',
  'Daviplata',
  'Lulo Bank',
  'Nubank',
  'Movii',
  'Rappipay',
  'Powwi',
  'Dale!',
  // ── Cooperativas financieras ──────────────────────────
  'Confiar Cooperativa Financiera',
  'Coofinep Cooperativa Financiera',
  'JFK Cooperativa Financiera',
  'Cotrafa Cooperativa Financiera',
]

const STAGES = ['Datos personales', 'Información bancaria', 'Tu perfil', 'Completado']

const inputStyle = {
  width: '100%',
  border: '1.5px solid #e5e7eb',
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 14,
  color: '#111827',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
  transition: 'border-color 0.18s',
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { getToken, saveToken } = useAuth()

  const [stage, setStage] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Stage 1
  const [nombre,   setNombre]   = useState('')
  const [apellido, setApellido] = useState('')
  const [cedula,   setCedula]   = useState('')
  const [telefono, setTelefono] = useState('')

  // Stage 2
  const [banco,        setBanco]        = useState('')
  const [tipoCuenta,   setTipoCuenta]   = useState('')
  const [numeroCuenta, setNumeroCuenta] = useState('')
  const [titular,      setTitular]      = useState('')

  // Stage 3
  const [tipoAliado, setTipoAliado] = useState('')
  const [ciudad,     setCiudad]     = useState('')

  async function post(path, body) {
    const token = getToken()
    const res = await fetch(`${API}${path}`, {
      method:  'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      credentials: 'include',
    })
    return res
  }

  async function handlePersonal(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await post('/api/aliados/onboarding/personal', { nombre, apellido, cedula, telefono })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Error al guardar.'); return }
      saveToken(data.accessToken)
      setStage(2)
    } catch { setError('No se pudo conectar con el servidor.') }
    finally { setLoading(false) }
  }

  async function handleBanco(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await post('/api/aliados/onboarding/banco', { banco, tipo_cuenta: tipoCuenta, numero_cuenta: numeroCuenta, titular })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Error al guardar.'); return }
      saveToken(data.accessToken)
      setStage(3)
    } catch { setError('No se pudo conectar con el servidor.') }
    finally { setLoading(false) }
  }

  async function handleTipo(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await post('/api/aliados/onboarding/tipo', { tipo_aliado: tipoAliado, ciudad })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Error al guardar.'); return }
      saveToken(data.accessToken)
      setStage(4)
    } catch { setError('No se pudo conectar con el servidor.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <LogoFull className="h-10" />
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px 32px', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}>

          {/* Progress bar */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              {STAGES.map((label, i) => (
                <div key={label} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: stage > i + 1 ? '#2D2A7A' : stage === i + 1 ? '#2D2A7A' : '#e5e7eb',
                    color: stage >= i + 1 ? '#fff' : '#9ca3af',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, margin: '0 auto 4px',
                    transition: 'background 0.3s',
                  }}>
                    {stage > i + 1 ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 10, color: stage === i + 1 ? '#2D2A7A' : '#9ca3af', fontWeight: stage === i + 1 ? 700 : 400 }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            {/* Track */}
            <div style={{ height: 3, background: '#e5e7eb', borderRadius: 2, marginTop: 4 }}>
              <div style={{
                height: '100%', borderRadius: 2, background: '#2D2A7A',
                width: `${((Math.min(stage, 4) - 1) / 3) * 100}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>

          {/* ── Stage 1: Información personal ── */}
          {stage === 1 && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Datos personales</h2>
              <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>Cuéntanos un poco sobre ti.</p>
              <form onSubmit={handlePersonal}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Nombre *">
                    <input style={inputStyle} value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Tu nombre"
                      onFocus={e => e.target.style.borderColor = '#2D2A7A'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                  </Field>
                  <Field label="Apellido *">
                    <input style={inputStyle} value={apellido} onChange={e => setApellido(e.target.value)} required placeholder="Tu apellido"
                      onFocus={e => e.target.style.borderColor = '#2D2A7A'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                  </Field>
                </div>
                <Field label="Número de cédula *">
                  <input style={inputStyle} value={cedula} onChange={e => setCedula(e.target.value.replace(/\D/g, ''))} required placeholder="Ej. 1234567890"
                    onFocus={e => e.target.style.borderColor = '#2D2A7A'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </Field>
                <Field label="Teléfono *">
                  <input style={inputStyle} type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} required placeholder="Ej. 300 123 4567"
                    onFocus={e => e.target.style.borderColor = '#2D2A7A'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </Field>
                {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <button type="submit" disabled={loading}
                  style={{ width: '100%', background: loading ? '#9ca3af' : '#2D2A7A', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 99, padding: '13px 0', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
                  {loading ? 'Guardando...' : 'Continuar'}
                </button>
              </form>
            </>
          )}

          {/* ── Stage 2: Datos bancarios ── */}
          {stage === 2 && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Datos bancarios</h2>
              <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>Para procesarte tus comisiones.</p>
              <form onSubmit={handleBanco}>
                <Field label="Banco o billetera *">
                  <select style={{ ...inputStyle, appearance: 'none' }} value={banco} onChange={e => setBanco(e.target.value)} required
                    onFocus={e => e.target.style.borderColor = '#2D2A7A'} onBlur={e => e.target.style.borderColor = '#e5e7eb'}>
                    <option value="">Selecciona tu banco...</option>
                    <optgroup label="Bancos tradicionales">
                      {BANCOS_COLOMBIA.slice(0, 22).map(b => <option key={b} value={b}>{b}</option>)}
                    </optgroup>
                    <optgroup label="Billeteras y neobancos">
                      {BANCOS_COLOMBIA.slice(22, 30).map(b => <option key={b} value={b}>{b}</option>)}
                    </optgroup>
                    <optgroup label="Cooperativas financieras">
                      {BANCOS_COLOMBIA.slice(30).map(b => <option key={b} value={b}>{b}</option>)}
                    </optgroup>
                  </select>
                </Field>
                <Field label="Tipo de cuenta *">
                  <select style={{ ...inputStyle, appearance: 'none' }} value={tipoCuenta} onChange={e => setTipoCuenta(e.target.value)} required
                    onFocus={e => e.target.style.borderColor = '#2D2A7A'} onBlur={e => e.target.style.borderColor = '#e5e7eb'}>
                    <option value="">Selecciona...</option>
                    <option value="Ahorros">Ahorros</option>
                    <option value="Corriente">Corriente</option>
                  </select>
                </Field>
                <Field label="Número de cuenta *">
                  <input style={inputStyle} value={numeroCuenta} onChange={e => setNumeroCuenta(e.target.value)} required placeholder="Número de tu cuenta"
                    onFocus={e => e.target.style.borderColor = '#2D2A7A'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </Field>
                <Field label="Titular de la cuenta *">
                  <input style={inputStyle} value={titular} onChange={e => setTitular(e.target.value)} required placeholder="Nombre del titular"
                    onFocus={e => e.target.style.borderColor = '#2D2A7A'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </Field>
                {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <button type="submit" disabled={loading}
                  style={{ width: '100%', background: loading ? '#9ca3af' : '#2D2A7A', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 99, padding: '13px 0', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
                  {loading ? 'Guardando...' : 'Continuar'}
                </button>
              </form>
            </>
          )}

          {/* ── Stage 3: Tu perfil ── */}
          {stage === 3 && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Tu perfil</h2>
              <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>Casi listo — dinos cómo trabajas.</p>
              <form onSubmit={handleTipo}>
                <Field label="Tipo de aliado *">
                  <select style={{ ...inputStyle, appearance: 'none' }} value={tipoAliado} onChange={e => setTipoAliado(e.target.value)} required
                    onFocus={e => e.target.style.borderColor = '#2D2A7A'} onBlur={e => e.target.style.borderColor = '#e5e7eb'}>
                    <option value="">Selecciona...</option>
                    {TIPOS_ALIADO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Ciudad *">
                  <input style={inputStyle} value={ciudad} onChange={e => setCiudad(e.target.value)} required placeholder="Ej. Bogotá, Medellín"
                    onFocus={e => e.target.style.borderColor = '#2D2A7A'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </Field>
                {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <button type="submit" disabled={loading}
                  style={{ width: '100%', background: loading ? '#9ca3af' : '#2D2A7A', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 99, padding: '13px 0', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
                  {loading ? 'Guardando...' : 'Finalizar'}
                </button>
              </form>
            </>
          )}

          {/* ── Stage 4: Listo ── */}
          {stage === 4 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 10 }}>¡Todo listo!</h2>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 32, lineHeight: 1.6 }}>
                Tu cuenta está lista.<br />¡Bienvenido al portal de aliados!
              </p>
              <button onClick={() => navigate('/dashboard', { replace: true })}
                style={{ background: '#2D2A7A', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 99, padding: '13px 32px', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#201D5F'}
                onMouseLeave={e => e.currentTarget.style.background = '#2D2A7A'}
              >
                Ir al dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
