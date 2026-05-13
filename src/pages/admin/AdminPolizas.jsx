import { useState } from 'react'
import { CheckCircle, Clock, XCircle } from 'lucide-react'

const ESTADOS = {
  en_proceso:    { label:'En proceso',   cls:'bg-yellow-50 text-yellow-700', icon: Clock        },
  aprobada:      { label:'Aprobada',     cls:'bg-green-50 text-green-700',   icon: CheckCircle  },
  no_convertida: { label:'No convertida',cls:'bg-red-50 text-red-600',       icon: XCircle      },
}

const fmt = (n) => new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', minimumFractionDigits:0 }).format(n)

const MOCK = [
  { id:'1', aliado_nombre:'Carlos M.', cliente_nombre:'Pedro G.', aseguradora:'SURA',    valor_prima:1900000, valor_comision:114000, estado:'en_proceso',    mes:5, anio:2025 },
  { id:'2', aliado_nombre:'María L.',  cliente_nombre:'Ana R.',   aseguradora:'Allianz', valor_prima:2100000, valor_comision:126000, estado:'aprobada',      mes:5, anio:2025 },
  { id:'3', aliado_nombre:'Carlos M.', cliente_nombre:'Luis T.',  aseguradora:'Bolívar', valor_prima:1750000, valor_comision:105000, estado:'no_convertida', mes:5, anio:2025 },
]

export default function AdminPolizas() {
  const [filtro, setFiltro] = useState('todos')

  const filtrados = MOCK.filter(p => filtro === 'todos' || p.estado === filtro)

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pólizas</h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona el estado de las pólizas — marca las aprobadas para liberar comisiones</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {['todos','en_proceso','aprobada','no_convertida'].map(f => (
          <button key={f} onClick={()=>setFiltro(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filtro===f?'bg-brand text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f === 'todos' ? 'Todos' : ESTADOS[f]?.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Cliente','Aseguradora','Prima','Comisión (6%)','Aliado','Estado','Acción'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-400 px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p, i) => {
              const est = ESTADOS[p.estado]
              const EstIcon = est.icon
              return (
                <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i===filtrados.length-1?'border-0':''}`}>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-gray-800">{p.cliente_nombre}</p>
                  </td>
                  <td className="px-5 py-3.5"><span className="text-sm text-gray-600">{p.aseguradora}</span></td>
                  <td className="px-5 py-3.5"><span className="text-sm font-semibold text-gray-800">{fmt(p.valor_prima)}</span></td>
                  <td className="px-5 py-3.5"><span className="text-sm font-semibold text-green-600">{fmt(p.valor_comision)}</span></td>
                  <td className="px-5 py-3.5"><span className="text-xs text-gray-500">{p.aliado_nombre}</span></td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${est.cls}`}>
                      <EstIcon size={11} />
                      {est.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {p.estado === 'en_proceso' && (
                      <button className="text-xs font-semibold bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                        ✓ Marcar aprobada
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
