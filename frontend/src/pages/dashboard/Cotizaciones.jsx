import { useState, useEffect } from 'react'
import { Car, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const ESTADO_BADGE = {
  activa:   { bg:'#dbeafe', color:'#1d4ed8', label:'Cotizada'         },
  enviada:  { bg:'#dcfce7', color:'#16a34a', label:'Enviada a emitir' },
  cerrada:  { bg:'#f3f4f6', color:'#6b7280', label:'Cerrada'          },
}

const fmt = n => n ? ('$' + Math.round(n).toLocaleString('es-CO')) : '—'

export default function Cotizaciones() {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
        <p className="text-gray-500 text-sm mt-1">Todas las cotizaciones que has realizado.</p>
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
            let datos = {}
            try { datos = JSON.parse(c.datos_cotizacion || '{}') } catch {}
            const badge = ESTADO_BADGE[c.estado] || ESTADO_BADGE.activa
            const fecha = new Date(c.created_at)
            const fechaStr = `${fecha.getDate()} ${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`
            const totalPlanes = (datos.planes_full || 0) + (datos.planes_basico || 0)
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Car size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {c.cliente_nombre || 'Cliente sin nombre'} · {c.placa || 'Sin placa'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {fechaStr}
                        {c.comercial_value ? ` · Valor: ${fmt(c.comercial_value)}` : ''}
                        {totalPlanes > 0 ? ` · ${totalPlanes} planes cotizados` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {datos.mejor_precio > 0 && (
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-400">Mejor precio</p>
                        <p className="text-sm font-bold text-gray-900">{fmt(datos.mejor_precio)}</p>
                      </div>
                    )}
                    <span style={{ background: badge.bg, color: badge.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
