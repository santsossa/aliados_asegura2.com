import { CreditCard, User, Building2, Edit3 } from 'lucide-react'
import { useState } from 'react'

export default function InfoFinanciera() {
  const [editandoBanco, setEditandoBanco] = useState(false)
  const [editandoPerfil, setEditandoPerfil] = useState(false)

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Información financiera</h1>
        <p className="text-gray-500 text-sm mt-1">Administra tus datos personales y cuenta bancaria.</p>
      </div>

      {/* Datos personales */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <User size={16} className="text-brand" />
            <h2 className="font-semibold text-gray-900 text-sm">Datos personales</h2>
          </div>
          <button
            onClick={() => setEditandoPerfil(!editandoPerfil)}
            className="flex items-center gap-1.5 text-xs text-brand font-medium hover:underline"
          >
            <Edit3 size={13} />
            {editandoPerfil ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Nombre completo', placeholder: 'Tu nombre', type: 'text' },
            { label: 'Número de cédula', placeholder: 'Ej. 1234567890', type: 'text' },
            { label: 'Teléfono', placeholder: 'Ej. 300 123 4567', type: 'tel' },
            { label: 'Ciudad', placeholder: 'Ej. Bogotá', type: 'text' },
            { label: 'Correo electrónico', placeholder: 'tu@correo.com', type: 'email' },
            { label: 'Tipo de aliado', placeholder: 'Ej. Concesionario', type: 'text' },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{f.label}</label>
              <input
                type={f.type}
                disabled={!editandoPerfil}
                placeholder={f.placeholder}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
              />
            </div>
          ))}
        </div>

        {editandoPerfil && (
          <div className="flex justify-end mt-5">
            <button
              onClick={() => setEditandoPerfil(false)}
              className="bg-brand text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-dark transition-colors"
            >
              Guardar cambios
            </button>
          </div>
        )}
      </div>

      {/* Cuenta bancaria */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-brand" />
            <h2 className="font-semibold text-gray-900 text-sm">Cuenta bancaria</h2>
          </div>
          <button
            onClick={() => setEditandoBanco(!editandoBanco)}
            className="flex items-center gap-1.5 text-xs text-brand font-medium hover:underline"
          >
            <Edit3 size={13} />
            {editandoBanco ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Banco', placeholder: 'Ej. Bancolombia' },
            { label: 'Tipo de cuenta', placeholder: 'Ahorros / Corriente' },
            { label: 'Número de cuenta', placeholder: 'Ej. 123 4567 8901' },
            { label: 'Titular de la cuenta', placeholder: 'Nombre del titular' },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{f.label}</label>
              <input
                type="text"
                disabled={!editandoBanco}
                placeholder={f.placeholder}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
          <Building2 size={13} className="text-gray-400" />
          <p className="text-xs text-gray-400">
            Solo puedes tener una cuenta bancaria registrada. Los pagos se depositan el 1 de cada mes.
          </p>
        </div>

        {editandoBanco && (
          <div className="flex justify-end mt-5">
            <button
              onClick={() => setEditandoBanco(false)}
              className="bg-brand text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-dark transition-colors"
            >
              Guardar cuenta
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
