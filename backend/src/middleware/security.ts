import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { env } from '../config/env'
import { Request, Response, NextFunction } from 'express'

// ── Helmet: cabeceras HTTP de seguridad ───────────────────────────────────
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", 'data:'],
      connectSrc:  ["'self'"],
      fontSrc:     ["'self'"],
      objectSrc:   ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: {
    maxAge:            31536000,
    includeSubDomains: true,
    preload:           true,
  },
  noSniff:            true,
  xssFilter:         true,
  referrerPolicy:    { policy: 'strict-origin-when-cross-origin' },
})

// ── CORS: solo permite el frontend configurado ─────────────────────────────
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowed = [env.FRONTEND_URL]
    // En desarrollo también permitimos sin origin (Postman, etc.)
    if (!origin || allowed.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: origen no permitido — ${origin}`))
    }
  },
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  maxAge:         86400,
})

// ── Rate limit general ─────────────────────────────────────────────────────
export const generalRateLimit = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  max:      parseInt(env.RATE_LIMIT_MAX),
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    status:  429,
    message: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.',
  },
})

// ── Rate limit estricto para auth — máx 3 intentos por IP ────────────────
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max:      3,               // máx 3 intentos de login por IP
  standardHeaders: true,
  legacyHeaders:   false,
  skipSuccessfulRequests: true,
  message: {
    status:  429,
    message: 'Demasiados intentos fallidos. Tu IP ha sido bloqueada temporalmente por 15 minutos.',
  },
  handler: (req, res) => {
    console.warn(`[SECURITY] Rate limit alcanzado — IP: ${req.ip} — ${req.path}`)
    res.status(429).json({
      status:  'error',
      message: 'Demasiados intentos fallidos. Tu IP ha sido bloqueada por 15 minutos.',
      code:    'RATE_LIMIT',
    })
  },
})

// ── Rate limit para OTP — máx 3 intentos ─────────────────────────────────
export const otpRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max:      3,
  standardHeaders: true,
  legacyHeaders:   false,
  skipSuccessfulRequests: true,
  message: {
    status:  429,
    message: 'Demasiados intentos de verificación. Espera 10 minutos.',
  },
  handler: (req, res) => {
    console.warn(`[SECURITY] OTP rate limit — IP: ${req.ip}`)
    res.status(429).json({
      status:  'error',
      message: 'Demasiados intentos de verificación. Espera 10 minutos.',
      code:    'RATE_LIMIT_OTP',
    })
  },
})

// ── Sanitización básica contra NoSQL/XSS ─────────────────────────────────
export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  const sanitize = (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(obj)) {
      const val = obj[key]
      if (typeof val === 'string') {
        // Elimina caracteres peligrosos
        result[key] = val
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .trim()
      } else if (val && typeof val === 'object' && !Array.isArray(val)) {
        result[key] = sanitize(val as Record<string, unknown>)
      } else {
        result[key] = val
      }
    }
    return result
  }

  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body)
  }
  next()
}

// ── No exponer stack traces en producción ────────────────────────────────
export function errorHandler(
  err: Error & { status?: number; statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = err.status || err.statusCode || 500

  console.error(`[ERROR] ${err.message}`, env.NODE_ENV === 'development' ? err.stack : '')

  res.status(status).json({
    status:  'error',
    message: env.NODE_ENV === 'production' && status === 500
      ? 'Error interno del servidor'
      : err.message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
