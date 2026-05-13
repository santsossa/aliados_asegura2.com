import { Mail, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LogoFull } from '../../components/Logo'

export default function VerificarCorreo() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">

        <div className="flex justify-center mb-8">
          <LogoFull />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8">
          <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Mail size={28} className="text-brand" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifica tu correo</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Te enviamos un enlace de verificación. Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500">
              ¿No llegó el correo? Espera unos minutos o revisa tu carpeta de spam.
            </p>
          </div>

          <button className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-600 text-sm font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors">
            <RefreshCw size={15} />
            Reenviar correo
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link to="/registro" className="text-brand font-medium hover:underline">
            Volver al registro
          </Link>
        </p>

      </div>
    </div>
  )
}
