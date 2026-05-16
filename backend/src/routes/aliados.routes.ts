import { Router } from 'express'
import { body } from 'express-validator'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { pool } from '../config/db'
import bcrypt from 'bcryptjs'

const router = Router()
router.use(requireAuth)

function tiempoHace(fecha: Date | string): string {
  const diff = Date.now() - new Date(fecha).getTime()
  const mins = diff / 60000
  if (mins < 60) return `Hace ${Math.floor(mins) || 1} min`
  const horas = mins / 60
  if (horas < 24) return `Hace ${Math.floor(horas)} hora${Math.floor(horas) > 1 ? 's' : ''}`
  const dias = horas / 24
  if (dias < 2) return 'Ayer'
  return `Hace ${Math.floor(dias)} días`
}

function variacionPct(actual: number, anterior: number): number {
  if (anterior === 0) return actual > 0 ? 100 : 0
  return Math.round(((actual - anterior) / anterior) * 100)
}

function buildGraficaMes(rows: any[], mesActual: number, anioActual: number): { dia: number; monto: number }[] {
  const hoy = new Date()
  const diasHasta = (hoy.getMonth() + 1 === mesActual && hoy.getFullYear() === anioActual)
    ? hoy.getDate()
    : new Date(anioActual, mesActual, 0).getDate()
  const map: Record<number, number> = {}
  for (const r of rows) map[Number(r.dia)] = Number(r.monto)
  return Array.from({ length: diasHasta }, (_, i) => ({ dia: i + 1, monto: map[i + 1] || 0 }))
}

// GET /api/aliados/me — perfil del aliado autenticado
router.get('/me', async (req, res, next) => {
  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT a.id, a.nombre, a.apellido, a.cedula, a.correo, a.telefono, a.ciudad, a.tipo_aliado, a.estado, a.created_at,
              b.banco, b.tipo_cuenta, b.numero_cuenta, b.titular
       FROM aliados a
       LEFT JOIN aliado_banco b ON b.aliado_id = a.id
       WHERE a.id = ?`,
      [req.aliado!.sub]
    )
    if (!rows.length) { res.status(404).json({ status:'error', message:'Aliado no encontrado' }); return }
    res.json({ status:'success', data: rows[0] })
  } catch (err) { next(err) }
})

// PUT /api/aliados/me — actualizar perfil
router.put('/me',
  [
    body('nombre').optional().trim().isLength({ min:2, max:100 }),
    body('apellido').optional().trim().isLength({ min:2, max:100 }),
    body('telefono').optional().trim().isLength({ min:7, max:20 }),
    body('ciudad').optional().trim().isLength({ min:2, max:80 }),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { nombre, apellido, telefono, ciudad } = req.body
      await pool.execute(
        'UPDATE aliados SET nombre=COALESCE(?,nombre), apellido=COALESCE(?,apellido), telefono=COALESCE(?,telefono), ciudad=COALESCE(?,ciudad) WHERE id=?',
        [nombre||null, apellido||null, telefono||null, ciudad||null, req.aliado!.sub]
      )
      res.json({ status:'success', message:'Perfil actualizado.' })
    } catch (err) { next(err) }
  }
)

// PUT /api/aliados/me/banco — guardar/actualizar cuenta bancaria
router.put('/me/banco',
  [
    body('banco').trim().isLength({ min:2, max:80 }).withMessage('Banco inválido'),
    body('tipo_cuenta').isIn(['Ahorros','Corriente']).withMessage('Tipo de cuenta inválido'),
    body('numero_cuenta').trim().isLength({ min:5, max:30 }).withMessage('Número de cuenta inválido'),
    body('titular').trim().isLength({ min:2, max:100 }).withMessage('Titular inválido'),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { banco, tipo_cuenta, numero_cuenta, titular } = req.body
      await pool.execute(
        `INSERT INTO aliado_banco (aliado_id, banco, tipo_cuenta, numero_cuenta, titular)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE banco=VALUES(banco), tipo_cuenta=VALUES(tipo_cuenta),
           numero_cuenta=VALUES(numero_cuenta), titular=VALUES(titular)`,
        [req.aliado!.sub, banco, tipo_cuenta, numero_cuenta, titular]
      )
      res.json({ status:'success', message:'Cuenta bancaria guardada.' })
    } catch (err) { next(err) }
  }
)

// PUT /api/aliados/me/contrasena — cambiar contraseña
router.put('/me/contrasena',
  [
    body('contrasena_actual').notEmpty(),
    body('contrasena_nueva').isLength({ min:8 }).withMessage('Mínimo 8 caracteres'),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { contrasena_actual, contrasena_nueva } = req.body
      const [rows] = await pool.execute<any[]>('SELECT contrasena_hash FROM aliados WHERE id=?', [req.aliado!.sub])
      const match = await bcrypt.compare(contrasena_actual, rows[0].contrasena_hash)
      if (!match) { res.status(401).json({ status:'error', message:'Contraseña actual incorrecta.' }); return }
      const hash = await bcrypt.hash(contrasena_nueva, 12)
      await pool.execute('UPDATE aliados SET contrasena_hash=? WHERE id=?', [hash, req.aliado!.sub])
      res.json({ status:'success', message:'Contraseña actualizada.' })
    } catch (err) { next(err) }
  }
)

// GET /api/aliados/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const id = req.aliado!.sub
    const now = new Date()
    const mes = now.getMonth() + 1
    const anio = now.getFullYear()
    const mesAnt = mes === 1 ? 12 : mes - 1
    const anioAnt = mes === 1 ? anio - 1 : anio

    // Próximo pago pendiente
    const [pagoRows] = await pool.execute<any[]>(
      `SELECT monto_total, mes, anio FROM pagos WHERE aliado_id=? AND estado='pendiente' ORDER BY anio,mes LIMIT 1`,
      [id]
    )
    const pago = pagoRows[0] || null
    let diasRestantes: number | null = null
    if (pago) {
      const fecha1 = new Date(pago.anio, pago.mes - 1, 1)
      diasRestantes = Math.max(0, Math.ceil((fecha1.getTime() - now.getTime()) / 86400000))
    }

    // Cotizaciones este mes y anterior
    const [[cMes]]    = await pool.execute<any[]>(`SELECT COUNT(*) total FROM cotizaciones WHERE aliado_id=? AND mes=? AND anio_cot=?`, [id, mes, anio])
    const [[cAnt]]    = await pool.execute<any[]>(`SELECT COUNT(*) total FROM cotizaciones WHERE aliado_id=? AND mes=? AND anio_cot=?`, [id, mesAnt, anioAnt])

    // Pólizas aprobadas este mes y anterior
    const [[pMes]]    = await pool.execute<any[]>(`SELECT COUNT(*) total FROM polizas WHERE aliado_id=? AND estado='aprobada' AND mes=? AND anio=?`, [id, mes, anio])
    const [[pAnt]]    = await pool.execute<any[]>(`SELECT COUNT(*) total FROM polizas WHERE aliado_id=? AND estado='aprobada' AND mes=? AND anio=?`, [id, mesAnt, anioAnt])

    // Total ganado histórico (pagos procesados)
    const [[ganTotal]]= await pool.execute<any[]>(`SELECT COALESCE(SUM(monto_total),0) total FROM pagos WHERE aliado_id=? AND estado='procesado'`, [id])
    const [[ganAnt]]  = await pool.execute<any[]>(`SELECT COALESCE(SUM(monto_total),0) total FROM pagos WHERE aliado_id=? AND estado='procesado' AND (anio<? OR (anio=? AND mes<?))`, [id, anio, anio, mes])

    // Actividad reciente: leads + polizas últimos 30 días, ordenados por fecha
    const [actividad] = await pool.execute<any[]>(
      `(SELECT 'lead' tipo, id, cliente_nombre, aseguradora, valor_prima monto, 'enviada' estado, created_at FROM leads WHERE aliado_id=? ORDER BY created_at DESC LIMIT 5)
       UNION ALL
       (SELECT 'poliza' tipo, id, cliente_nombre, aseguradora, valor_comision monto, estado, created_at FROM polizas WHERE aliado_id=? ORDER BY created_at DESC LIMIT 5)
       ORDER BY created_at DESC LIMIT 8`,
      [id, id]
    )

    // Comisiones este mes por día (para gráfica de barras)
    const [graficaRows] = await pool.execute<any[]>(
      `SELECT DAY(created_at) dia, SUM(valor_comision) monto FROM polizas WHERE aliado_id=? AND estado='aprobada' AND mes=? AND anio=? GROUP BY DAY(created_at) ORDER BY dia`,
      [id, mes, anio]
    )

    // Comisiones totales este mes (para rendimiento)
    const [[comMes]]  = await pool.execute<any[]>(`SELECT COALESCE(SUM(valor_comision),0) total FROM polizas WHERE aliado_id=? AND estado='aprobada' AND mes=? AND anio=?`, [id, mes, anio])

    // Sparkline cotizaciones: últimas 8 semanas, group by week
    const [spCot] = await pool.execute<any[]>(
      `SELECT WEEK(created_at) semana, COUNT(*) total FROM cotizaciones WHERE aliado_id=? AND created_at>=DATE_SUB(NOW(),INTERVAL 8 WEEK) GROUP BY WEEK(created_at) ORDER BY semana`,
      [id]
    )
    const [spPol] = await pool.execute<any[]>(
      `SELECT WEEK(created_at) semana, COUNT(*) total FROM polizas WHERE aliado_id=? AND estado='aprobada' AND created_at>=DATE_SUB(NOW(),INTERVAL 8 WEEK) GROUP BY WEEK(created_at) ORDER BY semana`,
      [id]
    )
    const [spGan] = await pool.execute<any[]>(
      `SELECT WEEK(created_at) semana, SUM(monto_total) total FROM pagos WHERE aliado_id=? AND estado='procesado' AND created_at>=DATE_SUB(NOW(),INTERVAL 8 WEEK) GROUP BY WEEK(created_at) ORDER BY semana`,
      [id]
    )

    res.json({
      status: 'success',
      data: {
        stats: {
          proximo_pago:    { monto: pago?.monto_total ?? 0, mes: pago?.mes ?? null, anio: pago?.anio ?? null, dias_restantes: diasRestantes },
          cotizaciones_mes:{ total: Number(cMes.total),  variacion: variacionPct(Number(cMes.total), Number(cAnt.total)) },
          polizas_mes:     { total: Number(pMes.total),  variacion: variacionPct(Number(pMes.total), Number(pAnt.total)) },
          total_ganado:    { monto: Number(ganTotal.total), variacion: variacionPct(Number(ganTotal.total), Number(ganAnt.total)) },
        },
        actividad: actividad.map(a => ({ ...a, hace: tiempoHace(a.created_at), monto: Number(a.monto) })),
        rendimiento: {
          comisiones_mes: Number(comMes.total),
          meta_mes: 5000000,
          grafica: buildGraficaMes(graficaRows, mes, anio),
        },
        sparklines: {
          cotizaciones: spCot.map((r: any) => Number(r.total)),
          polizas:      spPol.map((r: any) => Number(r.total)),
          ganancias:    spGan.map((r: any) => Number(r.total)),
        },
      }
    })
  } catch (err) { next(err) }
})

export default router
