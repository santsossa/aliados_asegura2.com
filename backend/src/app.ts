import './config/env'   // Valida variables de entorno primero
import express from 'express'
import cookieParser from 'cookie-parser'
import { helmetMiddleware, corsMiddleware, generalRateLimit, sanitizeInput, errorHandler } from './middleware/security'
import { testConnection } from './config/db'
import { env } from './config/env'

import authRoutes        from './routes/auth.routes'
import adminRoutes       from './routes/admin.routes'
import aliadosRoutes     from './routes/aliados.routes'
import cotizacionesRoutes from './routes/cotizaciones.routes'
import leadsRoutes       from './routes/leads.routes'
import polizasRoutes     from './routes/polizas.routes'
import pagosRoutes       from './routes/pagos.routes'

const app = express()

// ── Seguridad global ───────────────────────────────────────────────────────
app.use(helmetMiddleware)
app.use(corsMiddleware)
app.use(generalRateLimit)

// ── Parsers ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }))         // Limita el tamaño del body
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(sanitizeInput)

// ── Deshabilita header que revela la tecnología ───────────────────────────
app.disable('x-powered-by')

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'Aliados API', env: env.NODE_ENV }))

// ── Rutas ─────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes)
app.use('/api/admin',        adminRoutes)
app.use('/api/aliados',      aliadosRoutes)
app.use('/api/cotizaciones', cotizacionesRoutes)
app.use('/api/leads',        leadsRoutes)
app.use('/api/polizas',      polizasRoutes)
app.use('/api/pagos',        pagosRoutes)

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ status: 'error', message: 'Ruta no encontrada' }))

// ── Error handler global ──────────────────────────────────────────────────
app.use(errorHandler)

// ── Iniciar servidor ──────────────────────────────────────────────────────
async function start() {
  await testConnection()
  app.listen(parseInt(env.PORT), () => {
    console.log(`🚀 Aliados API corriendo en http://localhost:${env.PORT}`)
    console.log(`📦 Modo: ${env.NODE_ENV}`)
  })
}

start()
