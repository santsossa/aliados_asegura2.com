import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LogoFull } from '../../components/Logo'

const TIPOS_ALIADO = [
  'Asesor de concesionario',
  'Vendedor de carros usados',
  'Agente independiente',
  'Otro',
]

export default function Registro() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <LogoFull />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mb-6">
            Únete a nuestra red de aliados y empieza a ganar comisiones.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Nombre completo',       placeholder: 'Tu nombre completo',  type: 'text'  },
              { label: 'Número de cédula',       placeholder: 'Ej. 1234567890',      type: 'text'  },
              { label: 'Correo electrónico',     placeholder: 'tu@correo.com',       type: 'email' },
              { label: 'Teléfono',               placeholder: 'Ej. 300 123 4567',    type: 'tel'   },
              { label: 'Ciudad',                 placeholder: 'Ej. Bogotá',          type: 'text'  },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs font-medium text-gray-600 mb-1 block">{f.label} *</label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
                />
              </div>
            ))}

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Tipo de aliado *</label>
              <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white transition-colors">
                <option value="">Selecciona...</option>
                {TIPOS_ALIADO.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl mt-6 transition-colors">
            Crear cuenta
            <ArrowRight size={16} />
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Al registrarte aceptas nuestros{' '}
            <a href="#" className="text-brand hover:underline">Términos y condiciones</a>
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-brand font-medium hover:underline">
            Iniciar sesión
          </Link>
        </p>

      </div>
    </div>
  )
}
