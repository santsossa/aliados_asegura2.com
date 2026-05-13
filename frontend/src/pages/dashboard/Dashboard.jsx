import { DollarSign, FileText, Shield, TrendingUp, Car } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const STATS = [
  {
    icon: DollarSign,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    label: 'Próximo pago (1 jun)',
    value: '$0',
    sub: 'Pólizas aprobadas este mes',
  },
  {
    icon: FileText,
    iconBg: 'bg-blue-50',
    iconColor: 'text-brand',
    label: 'Cotizaciones este mes',
    value: '0',
    sub: 'Cotizaciones realizadas',
  },
  {
    icon: Shield,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    label: 'Pólizas aprobadas',
    value: '0',
    sub: 'Este mes',
  },
  {
    icon: TrendingUp,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    label: 'Total ganado histórico',
    value: '$0',
    sub: 'Desde tu registro',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Bienvenido de vuelta. Aquí está tu resumen.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {STATS.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className={`w-10 h-10 ${s.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={20} className={s.iconColor} />
              </div>
              <p className="text-xs text-gray-400 font-medium mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
            </div>
          )
        })}
      </div>

      {/* CTA Cotizar */}
      <div className="bg-brand rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-white font-bold text-lg">¿Tienes un cliente interesado?</h2>
          <p className="text-blue-100 text-sm mt-1">Inicia una cotización ahora y envíanos el lead para emitir la póliza.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/cotizar')}
          className="flex items-center gap-2 bg-white text-brand font-semibold text-sm px-5 py-3 rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap"
        >
          <Car size={16} />
          Iniciar cotización
        </button>
      </div>

      {/* Actividad reciente vacía */}
      <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Actividad reciente</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <FileText size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm font-medium">Sin actividad aún</p>
          <p className="text-gray-300 text-xs mt-1">Tus cotizaciones y pólizas aparecerán aquí</p>
        </div>
      </div>

    </div>
  )
}
