import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { LogoFull } from '../../components/Logo'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function getStrength(password) {
  let score = 0
  if (password.length >= 8)          score++
  if (/[A-Z]/.test(password))        score++
  if (/[a-z]/.test(password))        score++
  if (/[0-9]/.test(password))        score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score // 0–5
}

const STRENGTH_LABELS = ['', 'Débil', 'Regular', 'Buena', 'Fuerte', 'Fuerte']
const STRENGTH_COLORS = ['#e5e7eb', '#ef4444', '#f97316', '#eab308', '#22c55e', '#22c55e']

const labelStyle = (focused, filled) => ({
  position:   'absolute',
  left:       16,
  top:        focused || filled ? 8 : '50%',
  transform:  focused || filled ? 'none' : 'translateY(-50%)',
  fontSize:   focused || filled ? 11 : 14,
  color:      focused ? '#2D2A7A' : '#9ca3af',
  fontWeight: 500,
  transition: 'all 0.18s ease',
  pointerEvents: 'none',
  lineHeight: 1,
})

export default function Registro() {
  const navigate = useNavigate()

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [confirm,      setConfirm]      = useState('')
  const [showPass,     setShowPass]     = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [emailFocus,   setEmailFocus]   = useState(false)
  const [passFocus,    setPassFocus]    = useState(false)
  const [confirmFocus, setConfirmFocus] = useState(false)
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)

  const strength = getStrength(password)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (strength < 5) {
      setError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/registro`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ correo: email.trim().toLowerCase(), contrasena: password }),
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setError('Este correo ya está registrado.')
        } else if (res.status === 400 && data.code === 'WEAK_PASSWORD') {
          setError(data.message)
        } else if (res.status === 429) {
          setError('Demasiados intentos. Espera un momento.')
        } else {
          setError(data.message || 'Ocurrió un error. Intenta de nuevo.')
        }
        return
      }

      navigate('/registro/verificar', { state: { userId: data.userId, tipo: 'registro' } })
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <LogoFull className="h-10" />
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px 28px', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', textAlign: 'center', marginBottom: 6 }}>
            Crear cuenta
          </h1>
          <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', marginBottom: 28, lineHeight: 1.5 }}>
            Únete a nuestra red de aliados<br />y empieza a ganar comisiones.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <div style={{ border: `1.5px solid ${emailFocus ? '#2D2A7A' : '#e5e7eb'}`, borderRadius: 12, boxShadow: emailFocus ? '0 0 0 3px rgba(45,42,122,0.08)' : 'none', transition: 'all 0.18s ease', background: '#fff' }}>
                <label style={labelStyle(emailFocus, email.length > 0)}>Correo electrónico</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => setEmailFocus(true)} onBlur={() => setEmailFocus(false)}
                  required autoComplete="email"
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', paddingLeft: 16, paddingRight: 16, paddingTop: 22, paddingBottom: 10, fontSize: 14, color: '#111827', boxSizing: 'border-box', borderRadius: 12 }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <div style={{ border: `1.5px solid ${passFocus ? '#2D2A7A' : '#e5e7eb'}`, borderRadius: 12, boxShadow: passFocus ? '0 0 0 3px rgba(45,42,122,0.08)' : 'none', transition: 'all 0.18s ease', background: '#fff', position: 'relative' }}>
                <label style={labelStyle(passFocus, password.length > 0)}>Contraseña</label>
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  onFocus={() => setPassFocus(true)} onBlur={() => setPassFocus(false)}
                  required autoComplete="new-password"
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', paddingLeft: 16, paddingRight: 44, paddingTop: 22, paddingBottom: 10, fontSize: 14, color: '#111827', boxSizing: 'border-box', borderRadius: 12 }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password strength bar */}
            {password.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: i <= strength ? STRENGTH_COLORS[strength] : '#e5e7eb',
                      transition: 'background 0.2s',
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: 11, color: STRENGTH_COLORS[strength], margin: 0, fontWeight: 600 }}>
                  {STRENGTH_LABELS[strength]}
                </p>
              </div>
            )}

            {/* Confirm password */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <div style={{ border: `1.5px solid ${confirmFocus ? '#2D2A7A' : '#e5e7eb'}`, borderRadius: 12, boxShadow: confirmFocus ? '0 0 0 3px rgba(45,42,122,0.08)' : 'none', transition: 'all 0.18s ease', background: '#fff', position: 'relative' }}>
                <label style={labelStyle(confirmFocus, confirm.length > 0)}>Confirmar contraseña</label>
                <input
                  type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                  onFocus={() => setConfirmFocus(true)} onBlur={() => setConfirmFocus(false)}
                  required autoComplete="new-password"
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', paddingLeft: 16, paddingRight: 44, paddingTop: 22, paddingBottom: 10, fontSize: 14, color: '#111827', boxSizing: 'border-box', borderRadius: 12 }}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ color: '#dc2626', fontSize: 13, fontWeight: 500, margin: 0 }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: loading ? '#9ca3af' : '#2D2A7A', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 99, padding: '14px 0', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#201D5F' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#2D2A7A' }}
            >
              {loading ? 'Creando cuenta...' : <>Crear cuenta <ArrowRight size={16} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', marginTop: 20 }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: '#2D2A7A', fontWeight: 700, textDecoration: 'none' }}>Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
