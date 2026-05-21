import { Router, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { requireAuth, AuthPayload } from '../middleware/auth'
import { pool } from '../config/db'
import { env } from '../config/env'
import { sseAdd, sseRemove } from '../lib/sse'

const router = Router()

// ── SSE stream — auth por query param porque EventSource no soporta headers ──
// GET /api/notificaciones/stream?token=<jwt>
router.get('/stream', (req: Request, res: Response) => {
  const token = req.query.token as string | undefined
  if (!token) { res.status(401).end(); return }

  let payload: AuthPayload
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload
  } catch {
    res.status(401).end()
    return
  }

  const aliadoId = payload.sub

  // Cabeceras SSE
  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')   // evita buffering en nginx/Railway
  res.flushHeaders()

  // Evento inicial para confirmar conexión
  res.write('event: connected\ndata: {}\n\n')

  sseAdd(aliadoId, res)

  // Heartbeat cada 25 s — mantiene viva la conexión a través de proxies/load balancers
  const hb = setInterval(() => {
    try { res.write(':\n\n') } catch { /* cliente ya desconectado */ }
  }, 25_000)

  req.on('close', () => {
    clearInterval(hb)
    sseRemove(aliadoId, res)
  })
})

// ── Rutas autenticadas con JWT en header ─────────────────────────────────────
router.use(requireAuth)

// GET /api/notificaciones — últimas 50 del aliado autenticado
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
