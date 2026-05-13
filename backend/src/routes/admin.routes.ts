import { Router } from 'express'
import { body } from 'express-validator'
import { requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { pool } from '../config/db'

const router = Router()
router.use(requireAdmin)

// ── Dashboard ─────────────────────────────────────────────────────────────
router.get('/dashboard', async (_req, res, next) => {
  try {
    const d = new Date(); const mes = d.getMonth()+1; const anio = d.getFullYear()
    const [[aliados]]       = await pool.execute<any[]>('SELECT COUNT(*) as total, SUM(estado="activo") as activos FROM aliados')
    const [[leads_mes]]     = await pool.execute<any[]>('SELECT COUNT(*) as total FROM leads WHERE MONTH(created_at)=? AND YEAR(created_at)=?', [mes,anio])
    const [[polizas_mes]]   = await pool.execute<any[]>('SELECT COUNT(*) as total, SUM(estado="aprobada") as aprobadas, COALESCE(SUM(CASE WHEN estado="aprobada" THEN valor_comision END),0) as comisiones FROM polizas WHERE mes=? AND anio=?', [mes,anio])
    const [[pendiente_pago]]= await pool.execute<any[]>('SELECT COALESCE(SUM(valor_comision),0) as total FROM polizas WHERE estado="aprobada" AND mes=? AND anio=? AND id NOT IN (SELECT poliza_id FROM pago_detalles)', [mes,anio])

    res.json({ status:'success', data: { aliados, leads_mes, polizas_mes, pendiente_pago } })
  } catch(err) { next(err) }
})

// ── Gestión de aliados ────────────────────────────────────────────────────
router.get('/aliados', async (req, res, next) => {
  try {
    const estado = req.query.estado as string | undefined
    let sql = 'SELECT a.*, b.banco, b.numero_cuenta FROM aliados a LEFT JOIN aliado_banco b ON b.aliado_id=a.id'
    const params: any[] = []
    if (estado) { sql += ' WHERE a.estado=?'; params.push(estado) }
    sql += ' ORDER BY a.created_at DESC'
    const [rows] = await pool.execute<any[]>(sql, params)
    res.json({ status:'success', data: rows })
  } catch(err) { next(err) }
})

router.get('/aliados/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT a.*, b.banco, b.tipo_cuenta, b.numero_cuenta, b.titular,
       (SELECT COUNT(*) FROM cotizaciones WHERE aliado_id=a.id) as total_cotizaciones,
       (SELECT COUNT(*) FROM leads WHERE aliado_id=a.id) as total_leads,
       (SELECT COUNT(*) FROM polizas WHERE aliado_id=a.id AND estado="aprobada") as polizas_aprobadas,
       (SELECT COALESCE(SUM(valor_comision),0) FROM polizas WHERE aliado_id=a.id AND estado="aprobada") as comision_total
       FROM aliados a LEFT JOIN aliado_banco b ON b.aliado_id=a.id WHERE a.id=?`,
      [req.params.id]
    )
    if (!rows.length) { res.status(404).json({ status:'error', message:'Aliado no encontrado' }); return }
    res.json({ status:'success', data: rows[0] })
  } catch(err) { next(err) }
})

router.patch('/aliados/:id/estado',
  [body('estado').isIn(['activo','inactivo','pendiente']).withMessage('Estado inválido')],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      await pool.execute('UPDATE aliados SET estado=? WHERE id=?', [req.body.estado, req.params.id])
      res.json({ status:'success', message:'Estado actualizado.' })
    } catch(err) { next(err) }
  }
)

// ── Leads ──────────────────────────────────────────────────────────────────
router.get('/leads', async (req, res, next) => {
  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT l.*, a.nombre as aliado_nombre, a.correo as aliado_correo
       FROM leads l JOIN aliados a ON a.id=l.aliado_id
       ORDER BY l.created_at DESC`
    )
    res.json({ status:'success', data: rows })
  } catch(err) { next(err) }
})

// ── Pólizas ────────────────────────────────────────────────────────────────
router.get('/polizas', async (req, res, next) => {
  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT p.*, a.nombre as aliado_nombre
       FROM polizas p JOIN aliados a ON a.id=p.aliado_id
       ORDER BY p.created_at DESC`
    )
    res.json({ status:'success', data: rows })
  } catch(err) { next(err) }
})

router.patch('/polizas/:id/estado',
  [body('estado').isIn(['en_proceso','aprobada','no_convertida']).withMessage('Estado inválido')],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { estado } = req.body
      const primerPago = estado === 'aprobada' ? new Date() : null
      await pool.execute(
        'UPDATE polizas SET estado=?, primer_pago_at=? WHERE id=?',
        [estado, primerPago, req.params.id]
      )
      res.json({ status:'success', message:`Póliza marcada como ${estado}.` })
    } catch(err) { next(err) }
  }
)

// ── Liquidaciones ──────────────────────────────────────────────────────────
router.get('/liquidaciones', async (req, res, next) => {
  try {
    const mes  = req.query.mes  ? parseInt(req.query.mes as string)  : new Date().getMonth()+1
    const anio = req.query.anio ? parseInt(req.query.anio as string) : new Date().getFullYear()

    const [rows] = await pool.execute<any[]>(
      `SELECT a.id as aliado_id, a.nombre, a.correo,
       b.banco, b.tipo_cuenta, b.numero_cuenta, b.titular,
       COUNT(p.id) as num_polizas,
       COALESCE(SUM(p.valor_comision),0) as total_comision
       FROM aliados a
       JOIN polizas p ON p.aliado_id=a.id
       LEFT JOIN aliado_banco b ON b.aliado_id=a.id
       WHERE p.estado='aprobada' AND p.mes=? AND p.anio=?
         AND p.id NOT IN (SELECT poliza_id FROM pago_detalles)
       GROUP BY a.id, a.nombre, a.correo, b.banco, b.tipo_cuenta, b.numero_cuenta, b.titular
       ORDER BY total_comision DESC`,
      [mes, anio]
    )
    res.json({ status:'success', data: rows, mes, anio })
  } catch(err) { next(err) }
})

router.post('/liquidaciones/procesar',
  [
    body('aliado_id').isUUID(),
    body('mes').isInt({ min:1, max:12 }),
    body('anio').isInt({ min:2024 }),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { aliado_id, mes, anio } = req.body
      const [polizas] = await pool.execute<any[]>(
        `SELECT id, valor_comision FROM polizas
         WHERE aliado_id=? AND estado='aprobada' AND mes=? AND anio=?
           AND id NOT IN (SELECT poliza_id FROM pago_detalles)`,
        [aliado_id, mes, anio]
      )
      if (!polizas.length) { res.status(400).json({ status:'error', message:'No hay pólizas pendientes de pago.' }); return }

      const total = polizas.reduce((s: number, p: any) => s + parseFloat(p.valor_comision), 0)
      const [pagoResult] = await pool.execute<any>(
        'INSERT INTO pagos (aliado_id, monto_total, mes, anio, estado, pagado_at) VALUES (?, ?, ?, ?, "procesado", NOW())',
        [aliado_id, total, mes, anio]
      )
      for (const p of polizas) {
        await pool.execute('INSERT INTO pago_detalles (pago_id, poliza_id, comision) VALUES (?, ?, ?)', [pagoResult.insertId, p.id, p.valor_comision])
      }
      res.json({ status:'success', message:`Pago procesado. Total: $${total.toLocaleString('es-CO')}`, total, polizas: polizas.length })
    } catch(err) { next(err) }
  }
)

// ── Reportes ───────────────────────────────────────────────────────────────
router.get('/reportes/resumen', async (_req, res, next) => {
  try {
    const [porMes] = await pool.execute<any[]>(
      `SELECT mes, anio, COUNT(*) as polizas, COALESCE(SUM(valor_comision),0) as comisiones
       FROM polizas WHERE estado='aprobada'
       GROUP BY anio, mes ORDER BY anio DESC, mes DESC LIMIT 12`
    )
    const [topAliados] = await pool.execute<any[]>(
      `SELECT a.nombre, COUNT(p.id) as polizas, COALESCE(SUM(p.valor_comision),0) as comisiones
       FROM aliados a JOIN polizas p ON p.aliado_id=a.id WHERE p.estado='aprobada'
       GROUP BY a.id ORDER BY comisiones DESC LIMIT 10`
    )
    res.json({ status:'success', data: { por_mes: porMes, top_aliados: topAliados } })
  } catch(err) { next(err) }
})

export default router
