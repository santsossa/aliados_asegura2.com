import { useState, useEffect } from 'react'
import { Shield, Send, Info } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const fmt = n => n ? ('$' + Math.round(n).toLocaleString('es-CO')) : '—'

const ESTADOS = {
  en_proceso:    { bg:'#fef3c7', color:'#d97706', label:'En proceso',    desc:'Enviada a Asegura2.com. Nuestro equipo está gestionando la emisión con el cliente.' },
  aprobada:      { bg:'#dcfce7', color:'#16a34a', label:'Aprobada',      desc:'El cliente realizó el pago. Tu comisión está lista para el próximo pago del 1 del mes.' },
  no_convertida: { bg:'#fee2e2', color:'#dc2626', label:'No convertida', desc:'La venta no se cerró. No se genera comisión por esta póliza.' },
}

function Badge({ estado }) {
  const e = ESTADOS[estado] || ESTADOS.en_proceso
  return (
    <span style={{ background: e.bg, color: e.color, fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99, whiteSpace: 'nowrap' }}>
      {e.label}
    </span>
  )
}

export default function MisPolizas() {
  const { getToken } = useAuth()
  const [data, setData] = useState({ leads: [], polizas: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/aliados/me/polizas`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      credentials: 'include',
    })
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setData(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const allItems = [
    ...data.polizas.map(p => ({ ...p, _tipo: 'poliza' })),
    ...data.leads.map(l => ({ ...l, _tipo: 'lead', estado: 'en_proceso' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis pólizas</h1>
        <p className="text-gray-500 text-sm mt-1">Seguimiento de las pólizas que has enviado a emitir.</p>
      </div>

      {/* Leyenda */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Info size={15} className="text-blue-600" />
          <p className="text-sm font-semibold text-blue-700">¿Qué significa cada estado?</p>
        </div>
        <div className="space-y-2">
          {Object.values(ESTADOS).map(e => (
            <div key={e.label} className="flex items-start gap-2">
              <span style={{ background: e.bg, color: e.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap', marginTop: 2 }}>{e.label}</span>
              <p className="text-xs text-gray-500">{e.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}
        </div>
      ) : allItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <Shield size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium text-sm">Sin pólizas aún</p>
          <p className="text-gray-300 text-xs mt-1">Las pólizas que envíes a emitir aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allItems.map(item => {
            const fecha = new Date(item.created_at)
            const fechaStr = `${fecha.getDate()} ${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`
            return (
              <div key={`${item._tipo}-${item.id}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{item.cliente_nombre || 'Cliente'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.aseguradora || '—'}
                        {item.placa ? ` · ${item.placa}` : ''}
                        {' · '}{fechaStr}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-gray-900">{fmt(item.valor_prima)}</p>
                      {item.valor_comision && (
                        <p className="text-xs text-green-600 font-medium">Comisión: {fmt(item.valor_comision)}</p>
                      )}
                    </div>
                    <Badge estado={item.estado} />
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
