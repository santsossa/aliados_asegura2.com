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
  let acum = 0
  return Array.from({ length: diasHasta }, (_, i) => {
    acum += map[i + 1] || 0
    return { dia: i + 1, monto: acum }
  })
}

function padSparkline(rows: any[], minLength = 8): number[] {
  const vals = rows.map((r: any) => Number(r.total))
  while (vals.length < minLength) vals.unshift(0)
  return vals
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

    // Próximo pago = comisiones aprobadas este mes → se pagan el 1 del mes siguiente
    const [[comisionesMes]] = await pool.execute<any[]>(
      `SELECT COALESCE(SUM(valor_comision),0) total FROM polizas WHERE aliado_id=? AND estado='aprobada' AND MONTH(created_at)=? AND YEAR(created_at)=?`,
      [id, mes, anio]
    )
    const proximoMes  = mes === 12 ? 1 : mes + 1
    const proximoAnio = mes === 12 ? anio + 1 : anio
    const fechaPago   = new Date(proximoAnio, proximoMes - 1, 1)
    const diasRestantes = Math.max(0, Math.ceil((fechaPago.getTime() - now.getTime()) / 86400000))

    // Cotizaciones este mes y anterior
    const [[cMes]]    = await pool.execute<any[]>(`SELECT COUNT(*) total FROM cotizaciones WHERE aliado_id=? AND mes=? AND anio_cot=?`, [id, mes, anio])
    const [[cAnt]]    = await pool.execute<any[]>(`SELECT COUNT(*) total FROM cotizaciones WHERE aliado_id=? AND mes=? AND anio_cot=?`, [id, mesAnt, anioAnt])

    // Pólizas aprobadas este mes y anterior
    const [[pMes]]    = await pool.execute<any[]>(`SELECT COUNT(*) total FROM polizas WHERE aliado_id=? AND estado='aprobada' AND mes=? AND anio=?`, [id, mes, anio])
    const [[pAnt]]    = await pool.execute<any[]>(`SELECT COUNT(*) total FROM polizas WHERE aliado_id=? AND estado='aprobada' AND mes=? AND anio=?`, [id, mesAnt, anioAnt])

    // Total ganado histórico (pagos procesados)
    const [[ganTotal]]= await pool.execute<any[]>(`SELECT COALESCE(SUM(monto_total),0) total FROM pagos WHERE aliado_id=? AND estado='procesado'`, [id])
    const [[ganAnt]]  = await pool.execute<any[]>(`SELECT COALESCE(SUM(monto_total),0) total FROM pagos WHERE aliado_id=? AND estado='procesado' AND (anio<? OR (anio=? AND mes<?))`, [id, anio, anio, mes])

    // Actividad reciente: cotizaciones (todas, con su estado real) + polizas admin
    // NO se incluyen leads para evitar duplicados — la cotizacion ya cambia a estado='enviada'
    const [actividad] = await pool.execute<any[]>(
      `(SELECT 'cotizacion' tipo, id,
               COALESCE(cliente_nombre, 'Sin nombre') cliente_nombre,
               COALESCE(placa, '—') aseguradora,
               comercial_value monto,
               COALESCE(estado, 'activa') estado,
               created_at
        FROM cotizaciones
        WHERE aliado_id=?
        ORDER BY created_at DESC LIMIT 7)
       UNION ALL
       (SELECT 'poliza' tipo, id, cliente_nombre, aseguradora,
               valor_comision monto, estado, created_at
        FROM polizas WHERE aliado_id=?
        ORDER BY created_at DESC LIMIT 3)
       ORDER BY created_at DESC LIMIT 8`,
      [id, id]
    )

    // Comisiones este mes por día (para gráfica de barras) — filtra por fecha real de aprobación
    const [graficaRows] = await pool.execute<any[]>(
      `SELECT DAY(created_at) dia, SUM(valor_comision) monto FROM polizas WHERE aliado_id=? AND estado='aprobada' AND MONTH(created_at)=? AND YEAR(created_at)=? GROUP BY DAY(created_at) ORDER BY dia`,
      [id, mes, anio]
    )

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
      `SELECT WEEK(created_at) semana, SUM(valor_comision) total FROM polizas WHERE aliado_id=? AND estado='aprobada' AND created_at>=DATE_SUB(NOW(),INTERVAL 8 WEEK) GROUP BY WEEK(created_at) ORDER BY semana`,
      [id]
    )

    // Pólizas enviadas a emitir con estado en vivo (leads + su poliza si existe)
    const [polizasProceso] = await pool.execute<any[]>(
      `SELECT l.id, l.cliente_nombre, l.aseguradora, l.valor_prima, l.created_at,
              c.placa, c.comercial_value,
              COALESCE(p.estado, 'en_proceso') estado,
              COALESCE(p.valor_comision, 0) valor_comision
       FROM leads l
       LEFT JOIN cotizaciones c ON c.id = l.cotizacion_id
       LEFT JOIN polizas p ON p.lead_id = l.id
       WHERE l.aliado_id = ?
       ORDER BY l.created_at DESC
       LIMIT 10`,
      [id]
    )

    res.json({
      status: 'success',
      data: {
        stats: {
          proximo_pago:    { monto: Number(comisionesMes.total), mes: proximoMes, anio: proximoAnio, dias_restantes: diasRestantes },
          cotizaciones_mes:{ total: Number(cMes.total),  variacion: variacionPct(Number(cMes.total), Number(cAnt.total)) },
          polizas_mes:     { total: Number(pMes.total),  variacion: variacionPct(Number(pMes.total), Number(pAnt.total)) },
          total_ganado:    { monto: Number(ganTotal.total), variacion: variacionPct(Number(ganTotal.total), Number(ganAnt.total)) },
        },
        actividad: actividad.map(a => ({ ...a, hace: tiempoHace(a.created_at), monto: Number(a.monto) })),
        rendimiento: {
          comisiones_mes: Number(comisionesMes.total),
          meta_mes: 5000000,
          grafica: buildGraficaMes(graficaRows, mes, anio),
        },
        sparklines: {
          cotizaciones: padSparkline(spCot),
          polizas:      padSparkline(spPol),
          ganancias:    padSparkline(spGan),
        },
        polizas_proceso: polizasProceso.map(p => ({
          ...p,
          hace: tiempoHace(p.created_at),
          valor_prima:    Number(p.valor_prima),
          valor_comision: Number(p.valor_comision),
        })),
      }
    })
  } catch (err) { next(err) }
})

router.get('/me/cotizaciones', async (req, res, next) => {
  try {
    const now = new Date()
    // Permite navegar a un mes específico vía ?mes=5&anio=2026, por defecto el actual
    const mes  = req.query.mes  ? parseInt(req.query.mes  as string) : now.getMonth() + 1
    const anio = req.query.anio ? parseInt(req.query.anio as string) : now.getFullYear()

    const [rows] = await pool.execute<any[]>(
      `SELECT id, placa, anio, estado, cliente_nombre, cliente_telefono, cliente_correo,
              comercial_value, datos_cotizacion, mes, anio_cot, created_at,
              cliente_cedula, cliente_tipo_doc
       FROM cotizaciones
       WHERE aliado_id = ? AND mes = ? AND anio_cot = ?
       ORDER BY created_at DESC`,
      [req.aliado!.sub, mes, anio]
    )
    res.json({ status: 'success', data: rows, mes, anio })
  } catch (err) { next(err) }
})

router.get('/me/polizas', async (req, res, next) => {
  try {
    // Solo leads SIN póliza vinculada — si ya tiene póliza, aparece en la sección de pólizas
    const [leads] = await pool.execute<any[]>(
      `SELECT l.id, l.cotizacion_id, l.cliente_nombre, l.cliente_telefono, l.aseguradora,
              l.valor_prima, l.observaciones, l.crm_lead_id, l.created_at,
              c.placa, c.comercial_value, c.datos_cotizacion,
              c.cliente_correo, c.cliente_cedula, c.cliente_tipo_doc,
              'en_proceso' as estado, 'lead' as tipo
       FROM leads l
       LEFT JOIN cotizaciones c ON c.id = l.cotizacion_id
       WHERE l.aliado_id = ?
         AND NOT EXISTS (SELECT 1 FROM polizas p WHERE p.lead_id = l.id)
       ORDER BY l.created_at DESC`,
      [req.aliado!.sub]
    )
    // Pólizas procesadas por el equipo admin — con datos de cotización vía lead
    const [polizas] = await pool.execute<any[]>(
      `SELECT p.id, p.cliente_nombre, p.aseguradora, p.valor_prima, p.valor_comision,
              p.estado, p.created_at, p.mes, p.anio, 'poliza' as tipo,
              l.cotizacion_id, l.observaciones,
              c.placa, c.comercial_value, c.datos_cotizacion,
              c.cliente_correo, c.cliente_telefono, c.cliente_cedula, c.cliente_tipo_doc
       FROM polizas p
       LEFT JOIN leads l ON l.id = p.lead_id
       LEFT JOIN cotizaciones c ON c.id = l.cotizacion_id
       WHERE p.aliado_id = ? ORDER BY p.created_at DESC`,
      [req.aliado!.sub]
    )
    res.json({ status: 'success', data: { leads, polizas } })
  } catch (err) { next(err) }
})

// Detalle completo de una cotización enviada (para el modal)
router.get('/me/cotizaciones/:id/detalle', async (req, res, next) => {
  try {
    const aliadoId = req.aliado!.sub
    const { id } = req.params

    const [cotRows] = await pool.execute<any[]>(
      `SELECT c.*, l.id lead_id, l.aseguradora, l.valor_prima, l.observaciones, l.crm_lead_id,
              l.cliente_telefono lead_telefono,
              p.id poliza_id, p.estado poliza_estado, p.valor_comision, p.mes, p.anio
       FROM cotizaciones c
       LEFT JOIN leads l ON l.cotizacion_id = c.id AND l.aliado_id = c.aliado_id
       LEFT JOIN polizas p ON p.lead_id = l.id
       WHERE c.id = ? AND c.aliado_id = ?
       LIMIT 1`,
      [id, aliadoId]
    )
    if (!cotRows.length) { res.status(404).json({ status: 'error', message: 'No encontrada' }); return }
    const row = cotRows[0]
    let datos = {}
    try { datos = JSON.parse(row.datos_cotizacion || '{}') } catch {}
    res.json({ status: 'success', data: { ...row, datos_parsed: datos } })
  } catch (err) { next(err) }
})

export default router
