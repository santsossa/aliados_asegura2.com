import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { pool } from '../config/db'

const router = Router()
router.use(requireAuth)

// GET /api/polizas — pólizas del aliado con filtro de mes
router.get('/', async (req: any, res: any, next: any) => {
  try {
    const mes  = req.query.mes  ? parseInt(req.query.mes as string)  : null
    const anio = req.query.anio ? parseInt(req.query.anio as string) : new Date().getFullYear()

    let sql    = 'SELECT * FROM polizas WHERE aliado_id=?'
    const params: any[] = [req.aliado!.sub]

    if (mes) { sql += ' AND mes=? AND anio=?'; params.push(mes, anio) }
    sql += ' ORDER BY created_at DESC'

    const [rows] = await pool.execute<any[]>(sql, params)
    res.json({ status:'success', data: rows })
  } catch (err) { next(err) }
})

// GET /api/polizas/resumen — métricas rápidas para el dashboard
router.get('/resumen', async (req: any, res: any, next: any) => {
  try {
    const d    = new Date()
    const mes  = d.getMonth() + 1
    const anio = d.getFullYear()

    const [resumen] = await pool.execute<any[]>(
      `SELECT
         COUNT(*) AS total_polizas,
         SUM(CASE WHEN estado='aprobada' THEN 1 ELSE 0 END) AS aprobadas,
         SUM(CASE WHEN estado='en_proceso' THEN 1 ELSE 0 END) AS en_proceso,
         COALESCE(SUM(CASE WHEN estado='aprobada' THEN valor_comision ELSE 0 END), 0) AS comision_mes,
         COALESCE(SUM(valor_comision), 0) AS comision_total_historica
       FROM polizas
       WHERE aliado_id=? AND (
         (mes=? AND anio=?) OR
         anio <= ?
       )`,
      [req.aliado!.sub, mes, anio, anio]
    )

    const [proximoPago] = await pool.execute<any[]>(
      `SELECT COALESCE(SUM(valor_comision),0) AS monto
       FROM polizas
       WHERE aliado_id=? AND estado='aprobada' AND mes=? AND anio=?`,
      [req.aliado!.sub, mes, anio]
    )

    res.json({
      status: 'success',
      data: {
        ...resumen[0],
        proximo_pago: proximoPago[0].monto,
      }
    })
  } catch (err) { next(err) }
})

export default router
