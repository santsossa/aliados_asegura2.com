import { Shield, Info } from 'lucide-react'

const ESTADOS = [
  {
    key: 'en_proceso',
    label: 'En proceso',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-400',
    desc: 'El lead fue enviado a Asegurapp. Estamos gestionando la venta con el cliente.',
  },
  {
    key: 'aprobada',
    label: 'Aprobada',
    color: 'bg-green-50 text-green-700 border-green-200',
    dot: 'bg-green-400',
    desc: 'El cliente realizó el pago. La póliza fue emitida y tu comisión está lista para el próximo pago.',
  },
  {
    key: 'no_convertida',
    label: 'No convertida',
    color: 'bg-red-50 text-red-600 border-red-200',
    dot: 'bg-red-400',
    desc: 'La venta no se cerró. No se genera comisión por esta póliza.',
  },
]

const POLIZAS = []

function EstadoBadge({ estado }) {
  const e = ESTADOS.find(x => x.key === estado)
  if (!e) return null
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${e.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${e.dot}`} />
      {e.label}
    </span>
  )
}

export default function MisPolizas() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis pólizas</h1>
        <p className="text-gray-500 text-sm mt-1">Seguimiento de todas las pólizas que has enviado.</p>
      </div>

      {/* Leyenda de estados */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Info size={15} className="text-brand" />
          <p className="text-sm font-semibold text-brand">¿Qué significa cada estado?</p>
        </div>
        <div className="space-y-2">
          {ESTADOS.map(e => (
            <div key={e.key} className="flex items-start gap-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap mt-0.5 ${e.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${e.dot}`} />
                {e.label}
              </span>
              <p className="text-xs text-gray-500">{e.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lista */}
      {POLIZAS.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <Shield size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium text-sm">Sin pólizas aún</p>
          <p className="text-gray-300 text-xs mt-1">Las pólizas que envíes aparecerán aquí con su estado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {POLIZAS.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center">
                  <Shield size={18} className="text-brand" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{p.cliente}</p>
                  <p className="text-xs text-gray-400">{p.vehiculo} · {p.fecha}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900">{p.prima}</p>
                  <p className="text-xs text-green-600 font-medium">Comisión: {p.comision}</p>
                </div>
                <EstadoBadge estado={p.estado} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
