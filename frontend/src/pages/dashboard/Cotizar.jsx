import { X, Send, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Cotizar() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="h-full flex flex-col">

      {/* Topbar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">Iniciar cotización</h1>
            <p className="text-xs text-gray-400">Cotiza el seguro todo riesgo de tu cliente</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-brand text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-dark transition-colors"
          >
            <Send size={15} />
            Emitir póliza
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-500 text-sm font-medium px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <X size={15} />
            Cerrar cotización
          </button>
        </div>
      </div>

      {/* Comparador embebido */}
      <div className="flex-1 bg-gray-50">
        <iframe
          src="about:blank"
          title="Comparador de seguros"
          className="w-full h-full border-0"
        />
        {/* Placeholder mientras no está configurado */}
        <div className="absolute inset-0 mt-[73px] flex flex-col items-center justify-center text-center pointer-events-none">
          <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mb-4">
            <span className="text-3xl">🚗</span>
          </div>
          <p className="text-gray-400 font-medium">Comparador próximamente</p>
          <p className="text-gray-300 text-sm mt-1">Aquí se cargará el cotizador de seguros</p>
        </div>
      </div>

      {/* Modal confirmar emisión */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold text-gray-900 text-lg mb-1">Emitir póliza</h2>
            <p className="text-gray-500 text-sm mb-5">
              Completa los datos del cliente para enviarnos el lead y gestionar la emisión.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Nombre del cliente</label>
                <input
                  type="text"
                  placeholder="Ej. Carlos Rodríguez"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Teléfono del cliente</label>
                <input
                  type="tel"
                  placeholder="Ej. 300 123 4567"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Observaciones (opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Algún detalle adicional del cliente o el vehículo..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-brand text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-brand-dark transition-colors"
              >
                Enviar lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
