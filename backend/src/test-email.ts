/**
 * Script de prueba — envía el email de lead recibido con datos ficticios.
 * Uso: RESEND_API_KEY=re_xxx pnpm tsx src/test-email.ts
 */
import dotenv from 'dotenv'
dotenv.config()

process.env.NODE_ENV = 'production'
// Usar la URL del frontend en Railway para que las imágenes se vean en el test
if (!process.env.FRONTEND_URL || process.env.FRONTEND_URL.includes('localhost')) {
  process.env.FRONTEND_URL = 'https://aliados.asegura2.com.co'
}

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
