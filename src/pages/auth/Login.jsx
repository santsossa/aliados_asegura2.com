import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { LogoFull } from '../../components/Logo'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Login() {
  const navigate = useNavigate()
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [emailFocus, setEmailFocus] = useState(false)
  const [passFocus,  setPassFocus]  = useState(false)
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ correo: email.trim().toLowerCase(), contrasena: password }),
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 423) {
          setError('Cuenta bloqueada por múltiples intentos. Intenta de nuevo en 15 minutos.')
        } else if (res.status === 429) {
          setError('Demasiados intentos. Espera 15 minutos.')
        } else if (data.intentos_restantes !== undefined) {
          setError(`Credenciales incorrectas. Te quedan ${data.intentos_restantes} intento${data.intentos_restantes !== 1 ? 's' : ''}.`)
        } else {
          setError(data.message || 'Credenciales incorrectas.')
        }
        return
      }

      // Redirige a la pantalla de OTP pasando userId, tipo y OTP de dev si existe
      navigate('/login/otp', { state: { userId: data.userId, tipo: data.tipo } })

    } catch (err) {
      setError('No se pudo conectar con el servidor. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div style={{ minHeight:'100vh', background:'#f4f4f6', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ width:'100%', maxWidth:400 }}>

        <div style={{ display:'flex', justifyContent:'center', marginBottom:32 }}>
          <LogoFull className="h-10" />
        </div>

        <div style={{ background:'#fff', borderRadius:20, padding:'36px 32px 28px', boxShadow:'0 2px 24px rgba(0,0,0,0.07)' }}>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#111827', textAlign:'center', marginBottom:6 }}>
            Bienvenido de vuelta
          </h1>
          <p style={{ fontSize:13, color:'#9ca3af', textAlign:'center', marginBottom:28, lineHeight:1.5 }}>
            Ingresa tus credenciales para acceder<br />a tu portal.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ position:'relative', marginBottom:12 }}>
              <div style={{ border:`1.5px solid ${emailFocus ? '#2D2A7A' : '#e5e7eb'}`, borderRadius:12, boxShadow: emailFocus ? '0 0 0 3px rgba(45,42,122,0.08)' : 'none', transition:'all 0.18s ease', background:'#fff' }}>
                <label style={labelStyle(emailFocus, email.length > 0)}>Correo electrónico</label>
                <input
                  type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  onFocus={()=>setEmailFocus(true)} onBlur={()=>setEmailFocus(false)}
                  required autoComplete="email"
                  style={{ width:'100%', background:'transparent', border:'none', outline:'none', paddingLeft:16, paddingRight:16, paddingTop:22, paddingBottom:10, fontSize:14, color:'#111827', boxSizing:'border-box', borderRadius:12 }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ position:'relative', marginBottom:8 }}>
              <div style={{ border:`1.5px solid ${passFocus ? '#2D2A7A' : '#e5e7eb'}`, borderRadius:12, boxShadow: passFocus ? '0 0 0 3px rgba(45,42,122,0.08)' : 'none', transition:'all 0.18s ease', background:'#fff', position:'relative' }}>
                <label style={labelStyle(passFocus, password.length > 0)}>Contraseña</label>
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)}
                  onFocus={()=>setPassFocus(true)} onBlur={()=>setPassFocus(false)}
                  required autoComplete="current-password"
                  style={{ width:'100%', background:'transparent', border:'none', outline:'none', paddingLeft:16, paddingRight:44, paddingTop:22, paddingBottom:10, fontSize:14, color:'#111827', boxSizing:'border-box', borderRadius:12 }}
                />
                <button type="button" onClick={()=>setShowPass(v=>!v)}
                  style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', alignItems:'center' }}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <div style={{ textAlign:'right', marginBottom:20 }}>
              <button type="button" style={{ background:'none', border:'none', fontSize:13, color:'#2D2A7A', fontWeight:600, cursor:'pointer' }}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {error && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px', marginBottom:14 }}>
                <p style={{ color:'#dc2626', fontSize:13, fontWeight:500, margin:0 }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width:'100%', background: loading ? '#9ca3af' : '#2D2A7A', color:'#fff', fontWeight:700, fontSize:15, border:'none', borderRadius:99, padding:'14px 0', cursor: loading ? 'not-allowed' : 'pointer', transition:'background 0.2s' }}
              onMouseEnter={e=>{ if(!loading) e.currentTarget.style.background='#201D5F' }}
              onMouseLeave={e=>{ if(!loading) e.currentTarget.style.background='#2D2A7A' }}
            >
              {loading ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:13, color:'#9ca3af', marginTop:20 }}>
            ¿No tienes cuenta?{' '}
            <Link to="/registro" style={{ color:'#2D2A7A', fontWeight:700, textDecoration:'none' }}>Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
