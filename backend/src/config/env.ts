import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

// Valida que todas las variables de entorno requeridas existan al arrancar
const envSchema = z.object({
  PORT:                    z.string().default('3001'),
  NODE_ENV:                z.enum(['development', 'production', 'test']).default('development'),

  DB_HOST:                 z.string(),
  DB_PORT:                 z.string().default('3306'),
  DB_NAME:                 z.string(),
  DB_USER:                 z.string(),
  DB_PASSWORD:             z.string(),

  JWT_SECRET:              z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_REFRESH_SECRET:      z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN:          z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN:  z.string().default('7d'),

  OTP_EXPIRES_MINUTES:     z.string().default('10'),

  RESEND_API_KEY:          z.string().default(''),
  EMAIL_FROM:              z.string().email().default('noreply@asegura2.com.co'),
  EMAIL_FROM_NAME:         z.string().default('Asegura2.com'),

  FRONTEND_URL:            z.string().default('*'),

  RATE_LIMIT_WINDOW_MS:    z.string().default('900000'),
  RATE_LIMIT_MAX:          z.string().default('100'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
