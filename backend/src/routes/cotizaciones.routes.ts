import { Router } from 'express'
import { body } from 'express-validator'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { pool } from '../config/db'

const router = Router()
router.use(requireAuth)

const now = () => { const d = new Date(); return { mes: d.getMonth()+1, anio: d.getFullYear() } }

// GET /api/cotizaciones — cotizaciones del mes actual
router.get('/', async (req: any, res: any, next: any) => {
  try {
    const { mes, anio } = now()
    const [rows] = await pool.execute<any[]>(
      'SELECT * FROM cotizaciones WHERE aliado_id=? AND mes=? AND anio_cot=? ORDER BY created_at DESC',
      [req.aliado!.sub, mes, anio]
    )
    res.json({ status:'success', data: rows })
  } catch (err) { next(err) }
})

// POST /api/cotizaciones — registrar cotización
router.post('/',
  [
    body('placa').optional().trim().isLength({ max:10 }),
    body('marca').optional().trim().isLength({ max:60 }),
    body('modelo').optional().trim().isLength({ max:60 }),
    body('anio').optional().isInt({ min:1990, max:new Date().getFullYear()+1 }),
    body('aseguradora').optional().trim().isLength({ max:80 }),
    body('valor_prima').optional().isFloat({ min:0 }),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { placa, marca, modelo, anio, aseguradora, valor_prima, datos_cotizacion } = req.body
      const { mes, anio: anio_cot } = now()
      const [result] = await pool.execute<any>(
        `INSERT INTO cotizaciones (aliado_id, placa, marca, modelo, anio, aseguradora, valor_prima, datos_cotizacion, mes, anio_cot)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.aliado!.sub, placa||null, marca||null, modelo||null, anio||null,
         aseguradora||null, valor_prima||null, JSON.stringify(datos_cotizacion||{}), mes, anio_cot]
      )
      res.status(201).json({ status:'success', data:{ id: result.insertId } })
    } catch (err) { next(err) }
  }
)

export default router
