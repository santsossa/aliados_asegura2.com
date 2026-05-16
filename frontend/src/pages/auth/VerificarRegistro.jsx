import { RefreshCw } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef } from 'react'
import { LogoFull } from '../../components/Logo'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function VerificarRegistro() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { saveToken } = useAuth()

  const { userId } = location.state || {}

  const [otp,     setOtp]     = useState(['', '', '', '', '', ''])
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const inputs = useRef([])

  if (!userId) {
    navigate('/registro', { replace: true })
    return null
  }

  function handleChange(i, val) {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  async function handleVerify(e) {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) { setError('Ingresa los 6 dígitos del código.'); return }

    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/auth/verificar-registro`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId, otp: code }),
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          setError('Demasiados intentos. Espera 10 minutos.')
        } else {
          setError(data.message || 'Código inválido o expirado.')
        }
        setOtp(['', '', '', '', '', ''])
        inputs.current[0]?.focus()
        return
      }

      saveToken(data.accessToken)
      navigate('/onboarding', { replace: true })

    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <LogoFull className="h-10" />
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px 28px', boxShadow: '0 2px 24px rgba(0,0,0,0.07)' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
            Verifica tu correo
          </h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 32, lineHeight: 1.5 }}>
            Ingresa el código que enviamos a tu correo<br />para activar tu cuenta.
          </p>

          <form onSubmit={handleVerify}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={el => inputs.current[i] = el}
                  type="text" inputMode="numeric" maxLength={1} value={d}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  style={{
                    width: 48, height: 56, textAlign: 'center',
                    fontSize: 22, fontWeight: 700,
                    border: `2px solid ${d ? '#2D2A7A' : '#e5e7eb'}`,
                    borderRadius: 12,
                    outline: 'none',
                    transition: 'border 0.15s',
                    background: '#fff',
                    color: '#111827',
                  }}
                  onFocus={e => e.target.style.borderColor = '#2D2A7A'}
                  onBlur={e => e.target.style.borderColor = d ? '#2D2A7A' : '#e5e7eb'}
                />
              ))}
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 16, textAlign: 'left' }}>
                <p style={{ color: '#dc2626', fontSize: 13, fontWeight: 500, margin: 0 }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', background: loading ? '#9ca3af' : '#2D2A7A', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 99, padding: '14px 0', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', marginBottom: 14 }}
            >
              {loading ? 'Verificando...' : 'Verificar código'}
            </button>
          </form>

          <button onClick={() => navigate('/registro')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', background: 'none', border: 'none', fontSize: 13, color: '#9ca3af', cursor: 'pointer', padding: '6px 0' }}>
            <RefreshCw size={14} />
            Volver al registro
          </button>
        </div>
      </div>
    </div>
  )
}
