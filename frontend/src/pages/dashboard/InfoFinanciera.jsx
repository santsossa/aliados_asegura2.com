import { CreditCard, User, Building2, Edit3, Check, X, Loader2, Pencil, Shield, Bell, Lock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import ComboBox from '../../components/ComboBox'
import { AVATARES, getAvatarSrc } from '../../utils/avatars'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const BANCOS = [
  'Bancolombia','Banco de Bogotá','Davivienda','BBVA Colombia','Banco de Occidente',
  'Banco Popular','Banco AV Villas','Banco Caja Social','Scotiabank Colpatria',
  'Banco GNB Sudameris','Banco Itaú','Banco Falabella','Banco Agrario de Colombia',
  'Banco WWB','Banco Mundo Mujer','Bancoomeva','Banco Finandina','Banco Pichincha',
  'Banco Santander de Negocios Colombia','Banco Cooperativo Coopcentral',
  'Banco Serfinanza','Multibank',
  'Nequi','Daviplata','Lulo Bank','Nubank','Movii','Rappipay','Powwi','Dale!',
  'Confiar Cooperativa Financiera','Coofinep Cooperativa Financiera',
  'JFK Cooperativa Financiera','Cotrafa Cooperativa Financiera',
]

const TABS = [
  { id: 'cuenta',    label: 'Mi cuenta'        },
  { id: 'pagos',     label: 'Cuenta de pagos'  },
  { id: 'seguridad', label: 'Seguridad'         },
  { id: 'notifs',    label: 'Notificaciones'    },
]

function AvatarCircle({ avatarId, size = 80 }) {
  const src = getAvatarSrc(avatarId)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
      background: 'linear-gradient(135deg, #e8e6ff 0%, #c7d2fe 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {src
        ? <img src={src} alt="avatar" width={size} height={size}
            style={{ width: '90%', height: '90%', objectFit: 'contain', objectPosition: 'center center' }}
            decoding="async" fetchpriority="high" />
        : <User size={size * 0.4} color="#6366f1" />
      }
    </div>
  )
}

function ComingSoon({ icon: Icon, title, desc }) {
  return (
    <div style={{ padding: '56px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f0f1f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color="#9ca3af" />
      </div>
      <p style={{ margin: 0, fontFamily: 'Poppins', fontWeight: 600, fontSize: 15, color: '#374151' }}>{title}</p>
      <p style={{ margin: 0, fontFamily: 'Inter', fontSize: 13, color: '#9ca3af', textAlign: 'center', maxWidth: 320 }}>{desc}</p>
      <span style={{ marginTop: 4, background: '#f0f1f8', color: '#9ca3af', fontFamily: 'Inter', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99 }}>Próximamente</span>
    </div>
  )
}

export default function InfoFinanciera() {
  const { getToken, avatarId: globalAvatarId, setAvatarId: setGlobalAvatar } = useAuth()

  const [activeTab,  setActiveTab]  = useState('cuenta')
  const [perfil,     setPerfil]     = useState(null)
  const [banco,      setBanco]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  const [editPerfil,   setEditPerfil]   = useState(false)
  const [savingPerfil, setSavingPerfil] = useState(false)
  const [errPerfil,    setErrPerfil]    = useState('')
  const [formPerfil,   setFormPerfil]   = useState({})

  const [editBanco,   setEditBanco]   = useState(false)
  const [savingBanco, setSavingBanco] = useState(false)
  const [errBanco,    setErrBanco]    = useState('')
  const [formBanco,   setFormBanco]   = useState({})

  const [editAvatar,   setEditAvatar]   = useState(false)
  const [newAvatar,    setNewAvatar]    = useState(null)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [errAvatar,    setErrAvatar]    = useState('')

  useEffect(() => {
    fetch(`${API}/api/aliados/me`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      credentials: 'include',
    })
      .then(r => r.json())
      .then(d => {
        if (d.status !== 'success') { setError('No se pudo cargar tu información.'); return }
        const { banco: b, tipo_cuenta, numero_cuenta, titular, ...rest } = d.data
        setPerfil(rest)
        setBanco({ banco: b, tipo_cuenta, numero_cuenta, titular })
        setFormPerfil({ nombre: rest.nombre || '', apellido: rest.apellido || '', cedula: rest.cedula || '', telefono: rest.telefono || '', ciudad: rest.ciudad || '' })
        setFormBanco({ banco: b || '', tipo_cuenta: tipo_cuenta || '', numero_cuenta: numero_cuenta || '', titular: titular || '' })
        if (!globalAvatarId && rest.avatar) setGlobalAvatar(rest.avatar)
        setNewAvatar(rest.avatar || null)
      })
      .catch(() => setError('Error de conexión.'))
      .finally(() => setLoading(false))
  }, [])

  async function guardarAvatar() {
    if (!newAvatar) return
    setSavingAvatar(true); setErrAvatar('')
    try {
      const r = await fetch(`${API}/api/aliados/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
        body: JSON.stringify({ avatar: newAvatar }),
      })
      const d = await r.json()
      if (!r.ok) { setErrAvatar(d.message || 'Error al guardar.'); return }
      setPerfil(p => ({ ...p, avatar: newAvatar }))
      setGlobalAvatar(newAvatar)
      setEditAvatar(false)
    } catch { setErrAvatar('Error de conexión.') }
    finally { setSavingAvatar(false) }
  }

  async function guardarPerfil() {
    setSavingPerfil(true); setErrPerfil('')
    try {
      const r = await fetch(`${API}/api/aliados/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
        body: JSON.stringify(formPerfil),
      })
      const d = await r.json()
      if (!r.ok) { setErrPerfil(d.message || 'Error al guardar.'); return }
      setPerfil(p => ({ ...p, ...formPerfil }))
      setEditPerfil(false)
    } catch { setErrPerfil('Error de conexión.') }
    finally { setSavingPerfil(false) }
  }

  async function guardarBanco() {
    setSavingBanco(true); setErrBanco('')
    try {
      const r = await fetch(`${API}/api/aliados/me/banco`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
        body: JSON.stringify(formBanco),
      })
      const d = await r.json()
      if (!r.ok) { setErrBanco(d.message || 'Error al guardar.'); return }
      setBanco({ ...formBanco })
      setEditBanco(false)
    } catch { setErrBanco('Error de conexión.') }
    finally { setSavingBanco(false) }
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors'
  const dis  = 'w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-gray-50'

  if (loading) {
    const B = '#f0f1f3'
    const s = (r, h, w = '100%') => <div style={{ background: B, borderRadius: r, height: h, width: w, flexShrink: 0 }} />
    return (
      <div style={{ padding: '0 24px 32px', maxWidth: '72rem', margin: '0 auto', animation: 'skpulse 1.5s ease-in-out infinite' }}>
        <style>{`@keyframes skpulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
        <div style={{ paddingTop: 8, marginBottom: 20 }}>
          {s(8, 28, 180)}<div style={{ marginTop: 6, marginBottom: 16 }}>{s(5, 14, 300)}</div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[140, 130, 90, 120].map((w, i) => <div key={i} style={{ height: 36, width: w, background: B, borderRadius: 6 }} />)}
          </div>
        </div>
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>{s(50, 72, 72)}<div style={{ flex: 1 }}>{s(6, 14, '40%')}<div style={{ marginTop: 8 }}>{s(5, 12, '55%')}</div></div></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{s(4, 12, '50%')}{s(10, 40)}</div>)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) return (
    <div style={{ padding: 28 }}>
      <p style={{ color: '#ef4444', fontSize: 14 }}>{error}</p>
    </div>
  )

  return (
    <>
      <div style={{ padding: '0 24px 32px', maxWidth: '72rem', margin: '0 auto' }}>

        {/* ── Cabecera + tabs ── */}
        <div style={{ paddingTop: 8, marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontFamily: 'Poppins', fontWeight: 700, fontSize: 22, color: '#111827' }}>Configuración</h1>
          <p style={{ margin: '4px 0 16px', fontFamily: 'Inter', fontSize: 13, color: '#9ca3af' }}>
            Administra tu cuenta y preferencias como aliado.
          </p>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #2D2A7A' : '2px solid transparent',
                  background: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Inter',
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  color: activeTab === tab.id ? '#2D2A7A' : '#6b7280',
                  transition: 'color 0.15s, border-color 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Contenido ── */}
        <div>

        {/* ═══ TAB: Mi cuenta ═══ */}
        {activeTab === 'cuenta' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Sección: Foto de perfil */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div style={{ marginBottom: 18 }}>
                <h2 style={{ margin: '0 0 2px', fontFamily: 'Poppins', fontWeight: 600, fontSize: 14, color: '#111827' }}>Foto de perfil</h2>
                <p style={{ margin: 0, fontFamily: 'Inter', fontSize: 12, color: '#9ca3af' }}>Elige un avatar que te represente.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ position: 'relative' }}>
                  <AvatarCircle avatarId={globalAvatarId || perfil?.avatar} size={72} />
                  <button
                    onClick={() => { setNewAvatar(perfil?.avatar || null); setErrAvatar(''); setEditAvatar(true) }}
                    style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: '#2D2A7A', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Pencil size={10} color="#fff" />
                  </button>
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', fontFamily: 'Poppins', fontWeight: 600, fontSize: 14, color: '#111827' }}>
                    {[perfil?.nombre, perfil?.apellido].filter(Boolean).join(' ') || 'Sin nombre'}
                  </p>
                  <p style={{ margin: '0 0 10px', fontFamily: 'Inter', fontSize: 12, color: '#9ca3af' }}>{perfil?.correo}</p>
                  <button
                    onClick={() => { setNewAvatar(perfil?.avatar || null); setErrAvatar(''); setEditAvatar(true) }}
                    style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: '#2D2A7A', background: 'transparent', border: '1.5px solid rgba(45,42,122,0.3)', borderRadius: 8, padding: '5px 14px', cursor: 'pointer' }}
                  >
                    Cambiar avatar
                  </button>
                </div>
              </div>
            </div>

            {/* Sección: Datos personales */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <h2 style={{ margin: '0 0 2px', fontFamily: 'Poppins', fontWeight: 600, fontSize: 14, color: '#111827' }}>Datos personales</h2>
                  <p style={{ margin: 0, fontFamily: 'Inter', fontSize: 12, color: '#9ca3af' }}>Tu nombre, teléfono y ciudad de operación.</p>
                </div>
                {!editPerfil ? (
                  <button onClick={() => setEditPerfil(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: '#2D2A7A', background: 'transparent', border: '1.5px solid rgba(45,42,122,0.3)', borderRadius: 8, padding: '5px 14px', cursor: 'pointer' }}>
                    <Edit3 size={12} /> Editar
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setEditPerfil(false); setErrPerfil('') }}
                      style={{ fontFamily: 'Inter', fontSize: 12, color: '#9ca3af', background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>
                      Cancelar
                    </button>
                    <button onClick={guardarPerfil} disabled={savingPerfil}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: '#fff', background: '#2D2A7A', border: 'none', borderRadius: 8, padding: '5px 14px', cursor: 'pointer', opacity: savingPerfil ? 0.6 : 1 }}>
                      {savingPerfil ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />}
                      Guardar
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Nombre</label>
                  {editPerfil
                    ? <input className={inp} value={formPerfil.nombre} onChange={e => setFormPerfil(p => ({ ...p, nombre: e.target.value }))} />
                    : <div className={dis}>{perfil?.nombre || <span className="text-gray-300">—</span>}</div>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Apellido</label>
                  {editPerfil
                    ? <input className={inp} value={formPerfil.apellido} onChange={e => setFormPerfil(p => ({ ...p, apellido: e.target.value }))} />
                    : <div className={dis}>{perfil?.apellido || <span className="text-gray-300">—</span>}</div>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Teléfono</label>
                  {editPerfil
                    ? <input className={inp} type="tel" value={formPerfil.telefono} onChange={e => setFormPerfil(p => ({ ...p, telefono: e.target.value }))} />
                    : <div className={dis}>{perfil?.telefono || <span className="text-gray-300">—</span>}</div>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Ciudad</label>
                  {editPerfil
                    ? <input className={inp} value={formPerfil.ciudad} onChange={e => setFormPerfil(p => ({ ...p, ciudad: e.target.value }))} />
                    : <div className={dis}>{perfil?.ciudad || <span className="text-gray-300">—</span>}</div>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Correo electrónico <span style={{ color: '#d1d5db', fontWeight: 400 }}>(no editable)</span></label>
                  <div className={dis + ' cursor-not-allowed'}>{perfil?.correo}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Número de cédula <span style={{ color: '#d1d5db', fontWeight: 400 }}>(no editable)</span></label>
                  <div className={dis + ' cursor-not-allowed'}>{perfil?.cedula || <span className="text-gray-300">—</span>}</div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo de aliado</label>
                  <div className={dis + ' cursor-not-allowed'}>{perfil?.tipo_aliado || <span className="text-gray-300">—</span>}</div>
                </div>
              </div>
              {errPerfil && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 12 }}>{errPerfil}</p>}
            </div>

          </div>
        )}

        {/* ═══ TAB: Cuenta de pagos ═══ */}
        {activeTab === 'pagos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <h2 style={{ margin: '0 0 2px', fontFamily: 'Poppins', fontWeight: 600, fontSize: 14, color: '#111827' }}>Datos bancarios</h2>
                  <p style={{ margin: 0, fontFamily: 'Inter', fontSize: 12, color: '#9ca3af' }}>Cuenta donde recibirás tus comisiones el 1 de cada mes.</p>
                </div>
                {!editBanco ? (
                  <button onClick={() => setEditBanco(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: '#2D2A7A', background: 'transparent', border: '1.5px solid rgba(45,42,122,0.3)', borderRadius: 8, padding: '5px 14px', cursor: 'pointer' }}>
                    <Edit3 size={12} /> Editar
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setEditBanco(false); setErrBanco('') }}
                      style={{ fontFamily: 'Inter', fontSize: 12, color: '#9ca3af', background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>
                      Cancelar
                    </button>
                    <button onClick={guardarBanco} disabled={savingBanco}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: '#fff', background: '#2D2A7A', border: 'none', borderRadius: 8, padding: '5px 14px', cursor: 'pointer', opacity: savingBanco ? 0.6 : 1 }}>
                      {savingBanco ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />}
                      Guardar
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Banco o billetera</label>
                  {editBanco
                    ? <ComboBox value={formBanco.banco} onChange={v => setFormBanco(p => ({ ...p, banco: v }))} options={BANCOS.map(b => ({ v: b, label: b }))} placeholder="Busca tu banco..." />
                    : <div className={dis}>{banco?.banco || <span className="text-gray-300">—</span>}</div>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo de cuenta</label>
                  {editBanco
                    ? <ComboBox value={formBanco.tipo_cuenta} onChange={v => setFormBanco(p => ({ ...p, tipo_cuenta: v }))} options={[{ v: 'Ahorros', label: 'Ahorros' }, { v: 'Corriente', label: 'Corriente' }]} placeholder="Selecciona..." />
                    : <div className={dis}>{banco?.tipo_cuenta || <span className="text-gray-300">—</span>}</div>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Número de cuenta</label>
                  {editBanco
                    ? <input className={inp} value={formBanco.numero_cuenta} onChange={e => setFormBanco(p => ({ ...p, numero_cuenta: e.target.value }))} />
                    : <div className={dis}>{banco?.numero_cuenta || <span className="text-gray-300">—</span>}</div>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Titular de la cuenta</label>
                  {editBanco
                    ? <input className={inp} value={formBanco.titular} onChange={e => setFormBanco(p => ({ ...p, titular: e.target.value }))} />
                    : <div className={dis}>{banco?.titular || <span className="text-gray-300">—</span>}</div>}
                </div>
              </div>
              {errBanco && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 12 }}>{errBanco}</p>}

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={13} color="#9ca3af" />
                <p style={{ margin: 0, fontFamily: 'Inter', fontSize: 12, color: '#9ca3af' }}>
                  Los pagos se depositan el 1 de cada mes. Asegúrate de que los datos sean correctos para evitar demoras.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ═══ TAB: Seguridad ═══ */}
        {activeTab === 'seguridad' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <ComingSoon
              icon={Lock}
              title="Seguridad de la cuenta"
              desc="Pronto podrás cambiar tu número de teléfono para el código OTP y gestionar tus sesiones activas."
            />
          </div>
        )}

        {/* ═══ TAB: Notificaciones ═══ */}
        {activeTab === 'notifs' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <ComingSoon
              icon={Bell}
              title="Preferencias de notificaciones"
              desc="Pronto podrás elegir qué notificaciones recibir por correo o WhatsApp: pagos, cotizaciones aprobadas y más."
            />
          </div>
        )}

        </div>
      </div>

      {/* ── Modal selector de avatar ── */}
      {editAvatar && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 28, width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontFamily: 'Poppins', fontWeight: 600, fontSize: 16, color: '#111827' }}>Elige tu avatar</h3>
              <button onClick={() => { setEditAvatar(false); setErrAvatar('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <AvatarCircle avatarId={newAvatar} size={72} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
              {AVATARES.map(a => (
                <button key={a.id} onClick={() => setNewAvatar(a.id)}
                  style={{ padding: 0, border: 'none', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', outline: newAvatar === a.id ? '2.5px solid #2D2A7A' : '2.5px solid transparent', outlineOffset: 2, transition: 'outline 0.12s', background: 'linear-gradient(135deg,#e8e6ff,#c7d2fe)', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={a.src} alt={a.id} width={80} height={80} style={{ width: '85%', height: '85%', objectFit: 'contain', objectPosition: 'center', display: 'block' }} loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
            {errAvatar && <p style={{ margin: '0 0 12px', fontSize: 12, color: '#ef4444', textAlign: 'center' }}>{errAvatar}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setEditAvatar(false); setErrAvatar('') }}
                style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', fontFamily: 'Poppins', fontSize: 13, fontWeight: 500, color: '#6b7280', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={guardarAvatar} disabled={savingAvatar || !newAvatar}
                style={{ flex: 2, padding: '10px', borderRadius: 12, border: 'none', background: '#2D2A7A', fontFamily: 'Poppins', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: (!newAvatar || savingAvatar) ? 0.6 : 1 }}>
                {savingAvatar ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                Guardar avatar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  )
}
