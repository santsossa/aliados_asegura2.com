import { Users, FileText, Shield, DollarSign, TrendingUp, Clock } from 'lucide-react'

const STATS = [
  { icon: Users,      bg:'#eeedf8', color:'#2D2A7A', label:'Aliados activos',    value:'—', sub:'Total registrados'     },
  { icon: FileText,   bg:'#fef9c3', color:'#b45309', label:'Leads este mes',     value:'—', sub:'Enviados al equipo'    },
  { icon: Shield,     bg:'#dcfce7', color:'#16a34a', label:'Pólizas aprobadas',  value:'—', sub:'Mes actual'           },
  { icon: DollarSign, bg:'#fef3c7', color:'#d97706', label:'Comisiones por pagar',value:'—', sub:'Próximo 1 de mes'    },
]

export default function AdminDashboard() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Resumen general de la plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                <Icon size={18} color={s.color} />
              </div>
              <p className="text-xs text-gray-400 font-medium mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Actividad reciente placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp size={15} className="text-brand" />
            <h3 className="font-semibold text-gray-900 text-sm">Últimos leads</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText size={24} className="text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">Conecta el backend para ver datos</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Clock size={15} className="text-brand" />
            <h3 className="font-semibold text-gray-900 text-sm">Pólizas pendientes de aprobar</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Shield size={24} className="text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">Conecta el backend para ver datos</p>
          </div>
        </div>
      </div>
    </div>
  )
}
