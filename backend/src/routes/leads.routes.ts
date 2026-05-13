import { Router } from 'express'
import { body } from 'express-validator'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { pool } from '../config/db'
import { env } from '../config/env'

const router = Router()
router.use(requireAuth)

// POST /api/leads — enviar lead al CRM
router.post('/',
  [
    body('cliente_nombre').trim().isLength({ min:2, max:100 }).withMessage('Nombre del cliente requerido'),
    body('cliente_telefono').trim().isLength({ min:7, max:20 }).withMessage('Teléfono requerido'),
    body('aseguradora').trim().isLength({ min:2, max:80 }).withMessage('Aseguradora requerida'),
    body('valor_prima').isFloat({ min:0 }).withMessage('Prima inválida'),
    body('cotizacion_id').optional().isUUID(),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { cliente_nombre, cliente_telefono, aseguradora, valor_prima, cotizacion_id, observaciones } = req.body

      const [leadResult] = await pool.execute<any>(
        `INSERT INTO leads (aliado_id, cotizacion_id, cliente_nombre, cliente_telefono, aseguradora, valor_prima, observaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.aliado!.sub, cotizacion_id||null, cliente_nombre, cliente_telefono, aseguradora, valor_prima, observaciones||null]
      )

      // Obtener datos del aliado para enviar al CRM
      const [aliado] = await pool.execute<any[]>(
        'SELECT nombre, correo FROM aliados WHERE id=?',
        [req.aliado!.sub]
      )

      // TODO: Integrar con CRM real aquí
      // await fetch(`${CRM_URL}/api/leads`, { method:'POST', body: JSON.stringify({...}) })

      res.status(201).json({
        status:  'success',
        message: 'Lead enviado correctamente. Nos ponemos en contacto con tu cliente.',
        data:    { lead_id: leadResult.insertId },
      })
    } catch (err) { next(err) }
  }
)

// GET /api/leads — historial de leads del aliado
router.get('/', async (req: any, res: any, next: any) => {
  try {
    const [rows] = await pool.execute<any[]>(
      'SELECT * FROM leads WHERE aliado_id=? ORDER BY created_at DESC',
      [req.aliado!.sub]
    )
    res.json({ status:'success', data: rows })
  } catch (err) { next(err) }
})

export default router
