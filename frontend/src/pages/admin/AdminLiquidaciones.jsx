import { DollarSign, CheckCircle } from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', minimumFractionDigits:0 }).format(n)

const MOCK = [
  { aliado_id:'1', nombre:'Carlos Martínez', banco:'Bancolombia',  numero_cuenta:'123 4567 8901', num_polizas:5, total_comision:630000 },
  { aliado_id:'2', nombre:'María López',     banco:'Davivienda',   numero_cuenta:'987 6543 2100', num_polizas:3, total_comision:378000 },
  { aliado_id:'3', nombre:'Juan Rodríguez',  banco:'Nequi',        numero_cuenta:'310 000 0001',  num_polizas:2, total_comision:252000 },
]

const totalGeneral = MOCK.reduce((s, a) => s + a.total_comision, 0)

export default function AdminLiquidaciones() {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Liquidaciones</h1>
          <p className="text-gray-400 text-sm mt-1">Pagos de comisiones a procesar el 1 de cada mes</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total a pagar — Mayo 2025</p>
          <p className="text-2xl font-bold text-brand">{fmt(totalGeneral)}</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-brand rounded-2xl p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-white/60 text-sm">Próxima fecha de pago</p>
          <p className="text-white font-bold text-xl">1 de junio 2025</p>
          <p className="text-white/60 text-xs mt-1">{MOCK.length} aliados · {MOCK.reduce((s,a)=>s+a.num_polizas,0)} pólizas aprobadas</p>
        </div>
        <button className="flex items-center gap-2 bg-white text-brand font-bold text-sm px-5 py-3 rounded-xl hover:bg-blue-50 transition-colors">
          <CheckCircle size={16} />
          Procesar todos
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Aliado','Banco','Cuenta','Pólizas','Comisión','Acción'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-400 px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK.map((a, i) => (
              <tr key={a.aliado_id} className={`border-b border-gray-50 hover:bg-gray-50 ${i===MOCK.length-1?'border-0':''}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-light flex items-center justify-center text-brand text-xs font-bold flex-shrink-0">
                      {a.nombre[0]}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{a.nombre}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5"><span className="text-sm text-gray-600">{a.banco}</span></td>
                <td className="px-5 py-3.5"><span className="text-sm text-gray-500 font-mono">{a.numero_cuenta}</span></td>
                <td className="px-5 py-3.5"><span className="text-sm text-gray-600">{a.num_polizas}</span></td>
                <td className="px-5 py-3.5"><span className="text-sm font-bold text-green-600">{fmt(a.total_comision)}</span></td>
                <td className="px-5 py-3.5">
                  <button className="flex items-center gap-1.5 text-xs font-semibold bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                    <DollarSign size={12} /> Pagar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
