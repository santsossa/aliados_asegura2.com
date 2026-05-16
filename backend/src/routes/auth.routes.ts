import { Router } from 'express'
import { body, query } from 'express-validator'
import { authRateLimit, otpRateLimit } from '../middleware/security'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import * as AuthCtrl from '../controllers/auth.controller'

const router = Router()

// POST /api/auth/registro
router.post('/registro',
  authRateLimit,
  [
    body('correo').isEmail().normalizeEmail().withMessage('Correo inválido'),
    body('contrasena').isLength({ min:8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  ],
  validate,
  AuthCtrl.registro
)

// POST /api/auth/verificar-registro
router.post('/verificar-registro',
  otpRateLimit,
  [
    body('userId').isUUID().withMessage('ID inválido'),
    body('otp').isLength({ min:6, max:6 }).isNumeric().withMessage('OTP inválido'),
  ],
  validate,
  AuthCtrl.verificarRegistroOTP
)

// GET /api/auth/verificar-correo?token=...
router.get('/verificar-correo',
  [query('token').notEmpty().withMessage('Token requerido')],
  validate,
  AuthCtrl.verificarCorreo
)

// POST /api/auth/login
router.post('/login',
  authRateLimit,
  [
    body('correo').isEmail().normalizeEmail().withMessage('Correo inválido'),
    body('contrasena').notEmpty().withMessage('Contraseña requerida'),
  ],
  validate,
  AuthCtrl.login
)

// POST /api/auth/verificar-otp
router.post('/verificar-otp',
  otpRateLimit,
  [
    body('userId').isUUID().withMessage('ID inválido'),
    body('otp').isLength({ min:6, max:6 }).isNumeric().withMessage('OTP inválido'),
    body('tipo').isIn(['aliado','admin']).withMessage('Tipo inválido'),
  ],
  validate,
  AuthCtrl.verificarOTP
)

// POST /api/auth/refresh (usa cookie)
router.post('/refresh', AuthCtrl.refresh)

// POST /api/auth/logout
router.post('/logout', requireAuth, AuthCtrl.logout)

export default router
