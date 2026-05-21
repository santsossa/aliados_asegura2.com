import { Router, Request, Response, NextFunction } from 'express'
import { requireAuth } from '../middleware/auth'
import { pool } from '../config/db'

const router = Router()
router.use(requireAuth)

// GET /api/notificaciones — obtiene todas las notificaciones del aliado autenticado
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const aliadoId = req.aliado!.sub
    const [rows] = await pool.execute<any[]>(
      `SELECT id, tipo, titulo, mensaje, leida, created_at
       FROM notificaciones
       WHERE aliado_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [aliadoId]
    )
    const noLeidas = rows.filter((n: any) => !n.leida).length
    res.json({ status: 'success', data: rows, no_leidas: noLeidas })
  } catch (err) { next(err) }
})

// PATCH /api/notificaciones/marcar-leidas — marca todas como leídas
router.patch('/marcar-leidas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const aliadoId = req.aliado!.sub
    await pool.execute(
      `UPDATE notificaciones SET leida = TRUE WHERE aliado_id = ? AND leida = FALSE`,
      [aliadoId]
    )
    res.json({ status: 'success' })
  } catch (err) { next(err) }
})

export default router
