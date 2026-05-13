import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { pool } from '../config/db'

const router = Router()
router.use(requireAuth)

// GET /api/pagos — historial de pagos
router.get('/', async (req: any, res: any, next: any) => {
  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT p.*, GROUP_CONCAT(pd.poliza_id) AS poliza_ids, COUNT(pd.id) AS num_polizas
       FROM pagos p
       LEFT JOIN pago_detalles pd ON pd.pago_id = p.id
       WHERE p.aliado_id=?
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [req.aliado!.sub]
    )
    res.json({ status:'success', data: rows })
  } catch (err) { next(err) }
})

// GET /api/pagos/proximo — monto del próximo pago (pólizas aprobadas del mes)
router.get('/proximo', async (req: any, res: any, next: any) => {
  try {
    const d   = new Date()
    const mes = d.getMonth() + 1
    const anio= d.getFullYear()

    const [rows] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS polizas, COALESCE(SUM(valor_comision),0) AS monto
       FROM polizas
       WHERE aliado_id=? AND estado='aprobada' AND mes=? AND anio=?
         AND id NOT IN (SELECT poliza_id FROM pago_detalles)`,
      [req.aliado!.sub, mes, anio]
    )

    res.json({
      status: 'success',
      data: {
        monto:         rows[0].monto,
        polizas:       rows[0].polizas,
        fecha_pago:    `01/${String(mes+1 > 12 ? 1 : mes+1).padStart(2,'0')}/${mes+1>12?anio+1:anio}`,
      }
    })
  } catch (err) { next(err) }
})

export default router
