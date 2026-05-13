import { TrendingUp, Award, BarChart3 } from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', minimumFractionDigits:0 }).format(n)

const POR_MES = [
  { mes:'Ene', polizas:8,  comisiones:840000  },
  { mes:'Feb', polizas:12, comisiones:1260000 },
  { mes:'Mar', polizas:10, comisiones:1050000 },
  { mes:'Abr', polizas:15, comisiones:1575000 },
  { mes:'May', polizas:18, comisiones:1890000 },
]

const TOP_ALIADOS = [
  { nombre:'Carlos Martínez', polizas:24, comisiones:2520000 },
  { nombre:'María López',     polizas:18, comisiones:1890000 },
  { nombre:'Juan Rodríguez',  polizas:12, comisiones:1260000 },
  { nombre:'Ana García',      polizas:8,  comisiones:840000  },
]

const MAX_COM = Math.max(...POR_MES.map(m=>m.comisiones))

export default function AdminReportes() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-400 text-sm mt-1">Análisis del rendimiento de la plataforma</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Comisiones por mes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-brand" />
            <h3 className="font-semibold text-gray-900 text-sm">Comisiones pagadas por mes</h3>
          </div>
          <div className="flex items-end gap-3 h-40">
            {POR_MES.map(m => (
              <div key={m.mes} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400">{fmt(m.comisiones).replace('$','$').replace(/\.000$/,'k')}</span>
                <div className="w-full rounded-t-lg bg-brand transition-all" style={{ height: `${(m.comisiones/MAX_COM)*100}%`, minHeight:8 }} />
                <span className="text-xs text-gray-500 font-medium">{m.mes}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top aliados */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <Award size={16} className="text-accent" />
            <h3 className="font-semibold text-gray-900 text-sm">Top aliados</h3>
          </div>
          <div className="space-y-3">
            {TOP_ALIADOS.map((a, i) => (
              <div key={a.nombre} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-4">{i+1}</span>
                <div className="w-7 h-7 rounded-full bg-brand-light flex items-center justify-center text-brand text-xs font-bold flex-shrink-0">
                  {a.nombre[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{a.nombre}</p>
                  <p className="text-xs text-gray-400">{a.polizas} pólizas</p>
                </div>
                <span className="text-sm font-bold text-green-600">{fmt(a.comisiones)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen general */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={16} className="text-purple-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Resumen general</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label:'Total pólizas emitidas', value:'63',          color:'text-brand'    },
              { label:'Total comisiones pagadas',value:fmt(6615000), color:'text-green-600'},
              { label:'Aliados activos',         value:'12',         color:'text-purple-600'},
              { label:'Tasa de conversión',      value:'68%',        color:'text-accent'   },
            ].map(s => (
              <div key={s.label} className="text-center p-4 bg-gray-50 rounded-xl">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
