import { FileText, Send, Car, Calendar } from 'lucide-react'

const MES_ACTUAL = 'Mayo 2025'

// Datos de ejemplo vacíos — se llenará con datos reales
const COTIZACIONES = []

export default function Cotizaciones() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <Calendar size={13} />
          <span>{MES_ACTUAL}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Cotizaciones del mes</h1>
        <p className="text-gray-500 text-sm mt-1">
          Solo se muestran las cotizaciones realizadas este mes. Desde aquí puedes enviar un lead convertido.
        </p>
      </div>

      {/* Lista */}
      {COTIZACIONES.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <Car size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium text-sm">Sin cotizaciones este mes</p>
          <p className="text-gray-300 text-xs mt-1">Las cotizaciones que hagas este mes aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-3">
          {COTIZACIONES.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center">
                  <Car size={18} className="text-brand" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{c.cliente}</p>
                  <p className="text-xs text-gray-400">{c.vehiculo} · {c.fecha}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-900">{c.prima}</p>
                  <p className="text-xs text-gray-400">{c.aseguradora}</p>
                </div>
                <button className="flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-brand-dark transition-colors whitespace-nowrap">
                  <Send size={13} />
                  Emitir póliza
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
