import { Search, Phone } from 'lucide-react'
import { useState } from 'react'

const MOCK = [
  { id:'1', aliado_nombre:'Carlos M.',   cliente_nombre:'Pedro Gómez',    cliente_telefono:'310 000 0001', aseguradora:'SURA',    valor_prima:1900000, created_at:'2025-05-12' },
  { id:'2', aliado_nombre:'María L.',    cliente_nombre:'Ana Rodríguez',  cliente_telefono:'310 000 0002', aseguradora:'Allianz', valor_prima:2100000, created_at:'2025-05-11' },
  { id:'3', aliado_nombre:'Carlos M.',   cliente_nombre:'Luis Torres',    cliente_telefono:'310 000 0003', aseguradora:'Bolívar', valor_prima:1750000, created_at:'2025-05-10' },
]

const fmt = (n) => new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', minimumFractionDigits:0 }).format(n)

export default function AdminLeads() {
  const [search, setSearch] = useState('')

  const filtrados = MOCK.filter(l =>
    l.cliente_nombre.toLowerCase().includes(search.toLowerCase()) ||
    l.aliado_nombre.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="text-gray-400 text-sm mt-1">Clientes enviados por aliados listos para gestión</p>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar cliente o aliado..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Cliente','Teléfono','Aseguradora','Prima','Aliado','Fecha',''].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-400 px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((l, i) => (
              <tr key={l.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i===filtrados.length-1?'border-0':''}`}>
                <td className="px-5 py-3.5">
                  <p className="text-sm font-semibold text-gray-800">{l.cliente_nombre}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-sm text-gray-600">{l.cliente_telefono}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-sm text-gray-600">{l.aseguradora}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-sm font-semibold text-gray-800">{fmt(l.valor_prima)}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs text-gray-500">{l.aliado_nombre}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs text-gray-400">{l.created_at}</span>
                </td>
                <td className="px-5 py-3.5">
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-brand bg-brand-light px-3 py-1.5 rounded-lg hover:bg-brand hover:text-white transition-colors">
                    <Phone size={12} /> Llamar
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
