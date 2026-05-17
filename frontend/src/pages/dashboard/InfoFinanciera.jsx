import { CreditCard, User, Building2, Edit3, Check, X, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import ComboBox from '../../components/ComboBox'

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

export default function InfoFinanciera() {
  const { getToken } = useAuth()

  const [perfil,  setPerfil]  = useState(null)
  const [banco,   setBanco]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // Edición perfil
  const [editPerfil,  setEditPerfil]  = useState(false)
  const [savingPerfil,setSavingPerfil]= useState(false)
  const [errPerfil,   setErrPerfil]   = useState('')
  const [formPerfil,  setFormPerfil]  = useState({})

  // Edición banco
  const [editBanco,  setEditBanco]  = useState(false)
  const [savingBanco,setSavingBanco]= useState(false)
  const [errBanco,   setErrBanco]   = useState('')
  const [formBanco,  setFormBanco]  = useState({})

  /* ── Carga inicial ─────────────────────────────────── */
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
      })
      .catch(() => setError('Error de conexión.'))
      .finally(() => setLoading(false))
  }, [])

  /* ── Guardar perfil ────────────────────────────────── */
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

  /* ── Guardar banco ─────────────────────────────────── */
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

  /* ── Loading ───────────────────────────────────────── */
  if (loading) return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="h-7 w-52 bg-gray-100 rounded-lg mb-2 animate-pulse" />
      <div className="h-4 w-80 bg-gray-100 rounded mb-6 animate-pulse" />
      <div className="bg-white rounded-2xl border border-gray-100 h-64 mb-4 animate-pulse" />
      <div className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />
    </div>
  )

  if (error) return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <p className="text-red-500 text-sm">{error}</p>
    </div>
  )

  const inp = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors'
  const dis  = 'w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-gray-50'

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Información financiera</h1>
        <p className="text-gray-500 text-sm mt-1">Administra tus datos personales y cuenta bancaria.</p>
      </div>

      {/* ── Datos personales ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <User size={16} className="text-brand" />
            <h2 className="font-semibold text-gray-900 text-sm">Datos personales</h2>
          </div>
          {!editPerfil ? (
            <button onClick={() => setEditPerfil(true)}
              className="flex items-center gap-1.5 text-xs text-brand font-medium hover:underline">
              <Edit3 size={13} /> Editar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditPerfil(false); setErrPerfil('') }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                <X size={13} /> Cancelar
              </button>
              <button onClick={guardarPerfil} disabled={savingPerfil}
                className="flex items-center gap-1.5 text-xs text-white bg-brand px-3 py-1.5 rounded-lg font-medium hover:bg-brand-dark transition-colors disabled:opacity-60">
                {savingPerfil ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Guardar
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombre */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Nombre</label>
            {editPerfil
              ? <input className={inp} value={formPerfil.nombre} onChange={e => setFormPerfil(p => ({ ...p, nombre: e.target.value }))} />
              : <div className={dis}>{perfil?.nombre || <span className="text-gray-300">—</span>}</div>}
          </div>
          {/* Apellido */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Apellido</label>
            {editPerfil
              ? <input className={inp} value={formPerfil.apellido} onChange={e => setFormPerfil(p => ({ ...p, apellido: e.target.value }))} />
              : <div className={dis}>{perfil?.apellido || <span className="text-gray-300">—</span>}</div>}
          </div>
          {/* Cédula — no editable */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Número de cédula</label>
            <div className={dis + ' cursor-not-allowed'}>{perfil?.cedula || <span className="text-gray-300">—</span>}</div>
          </div>
          {/* Teléfono */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Teléfono</label>
            {editPerfil
              ? <input className={inp} type="tel" value={formPerfil.telefono} onChange={e => setFormPerfil(p => ({ ...p, telefono: e.target.value }))} />
              : <div className={dis}>{perfil?.telefono || <span className="text-gray-300">—</span>}</div>}
          </div>
          {/* Ciudad */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Ciudad</label>
            {editPerfil
              ? <input className={inp} value={formPerfil.ciudad} onChange={e => setFormPerfil(p => ({ ...p, ciudad: e.target.value }))} />
              : <div className={dis}>{perfil?.ciudad || <span className="text-gray-300">—</span>}</div>}
          </div>
          {/* Correo — solo lectura */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Correo electrónico</label>
            <div className={dis + ' cursor-not-allowed'}>{perfil?.correo}</div>
          </div>
          {/* Tipo aliado — solo lectura */}
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo de aliado</label>
            <div className={dis + ' cursor-not-allowed'}>{perfil?.tipo_aliado || <span className="text-gray-300">—</span>}</div>
          </div>
        </div>

        {errPerfil && <p className="text-red-500 text-xs mt-3">{errPerfil}</p>}
      </div>

      {/* ── Cuenta bancaria ──────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-brand" />
            <h2 className="font-semibold text-gray-900 text-sm">Cuenta bancaria</h2>
          </div>
          {!editBanco ? (
            <button onClick={() => setEditBanco(true)}
              className="flex items-center gap-1.5 text-xs text-brand font-medium hover:underline">
              <Edit3 size={13} /> Editar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditBanco(false); setErrBanco('') }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                <X size={13} /> Cancelar
              </button>
              <button onClick={guardarBanco} disabled={savingBanco}
                className="flex items-center gap-1.5 text-xs text-white bg-brand px-3 py-1.5 rounded-lg font-medium hover:bg-brand-dark transition-colors disabled:opacity-60">
                {savingBanco ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Guardar
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Banco */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Banco o billetera</label>
            {editBanco
              ? <ComboBox
                  value={formBanco.banco}
                  onChange={v => setFormBanco(p => ({ ...p, banco: v }))}
                  options={BANCOS.map(b => ({ v:b, label:b }))}
                  placeholder="Busca tu banco..."
                />
              : <div className={dis}>{banco?.banco || <span className="text-gray-300">—</span>}</div>}
          </div>
          {/* Tipo cuenta */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo de cuenta</label>
            {editBanco
              ? <ComboBox
                  value={formBanco.tipo_cuenta}
                  onChange={v => setFormBanco(p => ({ ...p, tipo_cuenta: v }))}
                  options={[{ v:'Ahorros', label:'Ahorros' }, { v:'Corriente', label:'Corriente' }]}
                  placeholder="Selecciona..."
                />
              : <div className={dis}>{banco?.tipo_cuenta || <span className="text-gray-300">—</span>}</div>}
          </div>
          {/* Número */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Número de cuenta</label>
            {editBanco
              ? <input className={inp} value={formBanco.numero_cuenta} onChange={e => setFormBanco(p => ({ ...p, numero_cuenta: e.target.value }))} />
              : <div className={dis}>{banco?.numero_cuenta || <span className="text-gray-300">—</span>}</div>}
          </div>
          {/* Titular */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Titular de la cuenta</label>
            {editBanco
              ? <input className={inp} value={formBanco.titular} onChange={e => setFormBanco(p => ({ ...p, titular: e.target.value }))} />
              : <div className={dis}>{banco?.titular || <span className="text-gray-300">—</span>}</div>}
          </div>
        </div>

        {errBanco && <p className="text-red-500 text-xs mt-3">{errBanco}</p>}

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
          <Building2 size={13} className="text-gray-400" />
          <p className="text-xs text-gray-400">
            Los pagos se depositan el 1 de cada mes. La cédula y el correo no se pueden cambiar.
          </p>
        </div>
      </div>

    </div>
  )
}
