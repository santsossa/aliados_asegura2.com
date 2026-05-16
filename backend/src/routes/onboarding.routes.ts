import { Router } from 'express'
import { body } from 'express-validator'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import * as OnboardingCtrl from '../controllers/onboarding.controller'

const router = Router()

// PUT /api/aliados/onboarding/personal
router.put('/personal',
  requireAuth,
  [
    body('nombre').trim().isLength({ min: 1, max: 100 }).withMessage('Nombre inválido'),
    body('apellido').trim().isLength({ min: 1, max: 100 }).withMessage('Apellido inválido'),
    body('cedula').trim().isLength({ min: 5, max: 20 }).withMessage('Cédula inválida'),
    body('telefono').trim().isLength({ min: 7, max: 20 }).withMessage('Teléfono inválido'),
  ],
  validate,
  OnboardingCtrl.personal
)

// PUT /api/aliados/onboarding/banco
router.put('/banco',
  requireAuth,
  [
    body('banco').trim().isLength({ min: 1, max: 80 }).withMessage('Banco inválido'),
    body('tipo_cuenta').isIn(['Ahorros', 'Corriente']).withMessage('Tipo de cuenta debe ser Ahorros o Corriente'),
    body('numero_cuenta').trim().isLength({ min: 1, max: 30 }).withMessage('Número de cuenta inválido'),
    body('titular').trim().isLength({ min: 1, max: 100 }).withMessage('Titular inválido'),
  ],
  validate,
  OnboardingCtrl.banco
)

// PUT /api/aliados/onboarding/tipo
router.put('/tipo',
  requireAuth,
  [
    body('tipo_aliado')
      .isIn(['Asesor de concesionario', 'Vendedor de carros usados', 'Agente independiente', 'Otro'])
      .withMessage('Tipo de aliado inválido'),
    body('ciudad').trim().isLength({ min: 2, max: 80 }).withMessage('Ciudad inválida'),
  ],
  validate,
  OnboardingCtrl.tipo
)

export default router
