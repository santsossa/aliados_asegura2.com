import { useState } from 'react'
import { Search, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react'

const ESTADO_BADGE = {
  activo:    { label:'Activo',    cls:'bg-green-50 text-green-700'  },
  pendiente: { label:'Pendiente', cls:'bg-yellow-50 text-yellow-700'},
  inactivo:  { label:'Inactivo',  cls:'bg-gray-100 text-gray-500'  },
}

// Datos de ejemplo — reemplazar con fetch al backend
const ALIADOS_MOCK = [
  { id:'1', nombre:'Carlos Martínez', correo:'carlos@gmail.com', ciudad:'Bogotá', tipo_aliado:'Asesor de concesionario', estado:'activo',    created_at:'2025-05-01' },
  { id:'2', nombre:'María López',     correo:'maria@gmail.com',  ciudad:'Medellín',tipo_aliado:'Vendedor de carros usados',estado:'pendiente',created_at:'2025-05-10' },
  { id:'3', nombre:'Juan Rodríguez',  correo:'juan@gmail.com',   ciudad:'Cali',   tipo_aliado:'Agente independiente',    estado:'inactivo', created_at:'2025-04-15' },
]

export default function AdminAliados() {
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState('todos')

  const filtrados = ALIADOS_MOCK.filter(a => {
    const matchSearch = a.nombre.toLowerCase().includes(search.toLowerCase()) || a.correo.toLowerCase().includes(search.toLowerCase())
    const matchFiltro = filtro === 'todos' || a.estado === filtro
    return matchSearch && matchFiltro
  })

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aliados</h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona los aliados registrados en la plataforma</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
          />
        </div>
        <div className="flex gap-2">
          {['todos','activo','pendiente','inactivo'].map(f => (
            <button key={f} onClick={()=>setFiltro(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${filtro===f ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-400 px-5 py-3">Aliado</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-5 py-3 hidden sm:table-cell">Ciudad</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-5 py-3 hidden md:table-cell">Tipo</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-5 py-3">Estado</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-5 py-3 hidden lg:table-cell">Registro</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((a, i) => {
              const badge = ESTADO_BADGE[a.estado]
              return (
                <tr key={a.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i===filtrados.length-1?'border-0':''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold text-xs flex-shrink-0">
                        {a.nombre[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{a.nombre}</p>
                        <p className="text-xs text-gray-400">{a.correo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className="text-sm text-gray-600">{a.ciudad}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-xs text-gray-500">{a.tipo_aliado}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className="text-xs text-gray-400">{a.created_at}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      {a.estado === 'pendiente' && (
                        <>
                          <button className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors" title="Aprobar">
                            <CheckCircle size={16} />
                          </button>
                          <button className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Rechazar">
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      <button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors" title="Ver detalle">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtrados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <p className="text-gray-400 text-sm">No se encontraron aliados</p>
          </div>
        )}
      </div>
    </div>
  )
}
