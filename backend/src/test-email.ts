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

import { sendLeadRecibidoEmail, sendOTPEmail } from './services/email.service'

async function main() {
  // Test OTP registro (sin nombre)
  console.log('📧 Enviando OTP registro...')
  await sendOTPEmail('santiagosossaher@gmail.com', null, '871557')
  console.log('✅ OTP registro enviado')
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1) })
