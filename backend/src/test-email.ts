/**
 * Script de prueba — envía el email de lead recibido con datos ficticios.
 * Uso: RESEND_API_KEY=re_xxx pnpm tsx src/test-email.ts
 */
import dotenv from 'dotenv'
dotenv.config()

// Forzar producción para que sendMail no corte el envío
process.env.NODE_ENV = 'production'

import { sendLeadRecibidoEmail } from './services/email.service'

async function main() {
  console.log('📧 Enviando correo de prueba...')
  await sendLeadRecibidoEmail({
    to:             'santiagosossaher@gmail.com',
    aliado_nombre:  'Santiago',
    cliente_nombre: 'Carlos Pérez',
    aseguradora:    'Seguros Bolívar',
    valor_prima:    4_317_828,
    placa:          'GSS026',
  })
  console.log('✅ Correo enviado a santiagosossaher@gmail.com')
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1) })
