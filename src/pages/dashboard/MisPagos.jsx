import { DollarSign, Clock, CheckCircle } from 'lucide-react'

const PAGOS_HISTORIAL = []

export default function MisPagos() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis pagos</h1>
        <p className="text-gray-500 text-sm mt-1">Los pagos se realizan el 1 de cada mes por las pólizas aprobadas.</p>
      </div>

      {/* Próximo pago */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-brand" />
          <h2 className="font-semibold text-gray-900 text-sm">Próximo pago — 1 de junio 2025</h2>
        </div>

        <div className="flex items-end gap-2 mb-1">
          <span className="text-4xl font-bold text-gray-900">$0</span>
          <span className="text-gray-400 text-sm mb-1">COP</span>
        </div>
        <p className="text-xs text-gray-400">0 pólizas aprobadas este mes</p>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Solo se incluyen pólizas donde el cliente haya pagado la primera cuota o el valor de contado.
          </p>
        </div>
      </div>

      {/* Historial */}
      <div>
        <h2 className="font-semibold text-gray-900 text-sm mb-3">Historial de pagos</h2>

        {PAGOS_HISTORIAL.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
              <DollarSign size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium text-sm">Sin pagos aún</p>
            <p className="text-gray-300 text-xs mt-1">Tu historial de pagos aparecerá aquí</p>
          </div>
        ) : (
          <div className="space-y-3">
            {PAGOS_HISTORIAL.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                    <CheckCircle size={18} className="text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{p.mes}</p>
                    <p className="text-xs text-gray-400">{p.polizas} pólizas · Pagado el {p.fecha}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{p.monto}</p>
                  <p className="text-xs text-green-600">Depositado</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
