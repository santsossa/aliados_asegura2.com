import { Router } from 'express'
import { body } from 'express-validator'
import { requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { pool } from '../config/db'
import { sendPolizaAprobadaEmail, sendPolizaNoAprobadaEmail, sendLeadRecibidoEmail } from '../services/email.service'
import { ssePush } from '../lib/sse'
import { randomUUID } from 'crypto'

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
      `SELECT l.*, a.nombre as aliado_nombre, a.correo as aliado_correo,
              c.placa, c.comercial_value, c.datos_cotizacion
       FROM leads l
       JOIN aliados a ON a.id = l.aliado_id
       LEFT JOIN cotizaciones c ON c.id = l.cotizacion_id
       ORDER BY l.created_at DESC`
    )
    res.json({ status:'success', data: rows })
  } catch(err) { next(err) }
})

// PATCH /api/admin/leads/:id/estado
// Cambia el estado de un lead y crea/actualiza la póliza correspondiente
// body: { estado: 'en_proceso'|'aprobada'|'no_convertida', observaciones?: string }
router.patch('/leads/:id/estado',
  [
    body('estado').isIn(['en_proceso','en_contacto','poliza_emitida','aprobada','no_convertida']).withMessage('Estado inválido'),
    body('observaciones').optional().isString().isLength({ max: 1000 }),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { estado, observaciones } = req.body
      const leadId = req.params.id

      // Buscar por id interno O por crm_lead_id (el CRM puede usar cualquiera de los dos)
      const [leads] = await pool.execute<any[]>(
        `SELECT l.*, a.nombre as aliado_nombre, a.correo as aliado_correo,
                c.placa, c.comercial_value
         FROM leads l
         JOIN aliados a ON a.id = l.aliado_id
         LEFT JOIN cotizaciones c ON c.id = l.cotizacion_id
         WHERE l.id = ? OR l.crm_lead_id = ?
         LIMIT 1`,
        [leadId, leadId]
      )
      if (!leads.length) { res.status(404).json({ status:'error', message:'Lead no encontrado' }); return }
      const lead = leads[0]

      // Buscar póliza existente vinculada a este lead (siempre por lead.id, no por el param del CRM)
      const [polRows] = await pool.execute<any[]>('SELECT id FROM polizas WHERE lead_id = ? LIMIT 1', [lead.id])
      const now       = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const nextMes   = nextMonth.getMonth() + 1
      const nextAnio  = nextMonth.getFullYear()

      if (polRows.length) {
        // Actualizar póliza existente — si se aprueba, actualizar mes/anio al pago del mes siguiente
        await pool.execute(
          `UPDATE polizas SET estado=?, observaciones=COALESCE(?,observaciones),
           mes = CASE WHEN ?='aprobada' THEN ? ELSE mes END,
           anio = CASE WHEN ?='aprobada' THEN ? ELSE anio END,
           primer_pago_at=CASE WHEN ?='aprobada' THEN ? ELSE primer_pago_at END
           WHERE lead_id=?`,
          [estado, observaciones || null, estado, nextMes, estado, nextAnio, estado, now, lead.id]
        )
      } else {
        // Crear póliza nueva — mes/anio apuntan al 1 del mes siguiente (fecha de pago)
        await pool.execute(
          `INSERT INTO polizas (aliado_id, lead_id, cliente_nombre, aseguradora, valor_prima, estado, mes, anio, primer_pago_at)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          [lead.aliado_id, lead.id, lead.cliente_nombre, lead.aseguradora,
           lead.valor_prima, estado, nextMes, nextAnio,
           estado === 'aprobada' ? now : null]
        )
      }

      // Enviar email al aliado según el estado
      const comision = Math.round(parseFloat(lead.valor_prima || 0) / 1.19 * 0.06)
      if (estado === 'aprobada') {
        sendPolizaAprobadaEmail({
          to:             lead.aliado_correo,
          aliado_nombre:  lead.aliado_nombre,
          cliente_nombre: lead.cliente_nombre,
          aseguradora:    lead.aseguradora,
          valor_prima:    parseFloat(lead.valor_prima || 0),
          valor_comision: comision,
          placa:          lead.placa || undefined,
        }).catch(() => {})
      } else if (estado === 'no_convertida' && observaciones) {
        sendPolizaNoAprobadaEmail({
          to:             lead.aliado_correo,
          aliado_nombre:  lead.aliado_nombre,
          cliente_nombre: lead.cliente_nombre,
          aseguradora:    lead.aseguradora,
          placa:          lead.placa || undefined,
          motivo:         observaciones,
        }).catch(() => {})
      }

      // Crear notificación y empujar en tiempo real al aliado
      try {
        const placaStr = lead.placa ? ` · ${lead.placa}` : ''
        let notifTipo   = ''
        let notifTitulo = ''
        let notifMsg    = ''

        if (estado === 'aprobada') {
          notifTipo   = 'poliza_aprobada'
          notifTitulo = `¡Póliza aprobada!${placaStr}`
          notifMsg    = `La póliza de ${lead.cliente_nombre} con ${lead.aseguradora}${placaStr} fue aprobada. Tu comisión es $${comision.toLocaleString('es-CO')}.`
        } else if (estado === 'no_convertida') {
          notifTipo   = 'poliza_no_aprobada'
          notifTitulo = `Póliza no aprobada${placaStr}`
          notifMsg    = `La póliza de ${lead.cliente_nombre} con ${lead.aseguradora}${placaStr} no fue aprobada.${observaciones ? ' Motivo: ' + observaciones : ''}`
        } else if (estado === 'en_contacto') {
          notifTipo   = 'estado_actualizado'
          notifTitulo = `Estamos contactando al cliente${placaStr}`
          notifMsg    = `Tu solicitud para ${lead.cliente_nombre} con ${lead.aseguradora}${placaStr} avanza. Nuestro asesor está intentando comunicarse con el cliente.`
        } else if (estado === 'en_proceso') {
          notifTipo   = 'estado_actualizado'
          notifTitulo = `¡El cliente quiere la póliza!${placaStr}`
          notifMsg    = `El cliente de ${lead.cliente_nombre}${placaStr} está interesado en la póliza con ${lead.aseguradora}. Estamos haciendo los trámites para emitirla.`
        } else if (estado === 'poliza_emitida') {
          notifTipo   = 'estado_actualizado'
          notifTitulo = `Póliza emitida ✍️${placaStr}`
          notifMsg    = `Se emitió la póliza para ${lead.cliente_nombre} con ${lead.aseguradora}${placaStr}. Esperamos el primer pago del cliente para confirmar tu comisión.`
        }

        if (notifTipo) {
          const notifId  = randomUUID()
          const notifNow = new Date().toISOString()
          await pool.execute(
            `INSERT INTO notificaciones (id, aliado_id, tipo, titulo, mensaje) VALUES (?, ?, ?, ?, ?)`,
            [notifId, lead.aliado_id, notifTipo, notifTitulo, notifMsg]
          )
          ssePush(lead.aliado_id, 'notificacion', {
            id: notifId, tipo: notifTipo, titulo: notifTitulo,
            mensaje: notifMsg, leida: false, created_at: notifNow,
          })
        }

        // Evento de actualización de estado (usa lead.id, no el param del CRM)
        const [polRow] = await pool.execute<any[]>('SELECT id, valor_comision FROM polizas WHERE lead_id = ? LIMIT 1', [lead.id])
        ssePush(lead.aliado_id, 'poliza_update', {
          lead_id:        lead.id,
          poliza_id:      polRow[0]?.id || null,
          estado,
          aseguradora:    lead.aseguradora,
          cliente_nombre: lead.cliente_nombre,
          valor_prima:    parseFloat(lead.valor_prima || 0),
          valor_comision: polRow[0] ? parseFloat(polRow[0].valor_comision) : comision,
          placa:          lead.placa || null,
          created_at:     new Date().toISOString(),
        })
      } catch { /* no interrumpir flujo principal */ }

      res.json({ status:'success', message:`Lead marcado como ${estado}.` })
    } catch(err) { next(err) }
  }
)

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

// PATCH /api/admin/polizas/:id/estado
// body: { estado: 'aprobada'|'no_convertida', observaciones?: string }
router.patch('/polizas/:id/estado',
  [
    body('estado').isIn(['en_proceso','en_contacto','poliza_emitida','aprobada','no_convertida']).withMessage('Estado inválido'),
    body('observaciones').optional().isString().isLength({ max: 1000 }),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { estado, observaciones } = req.body
      const now       = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const nextMes   = nextMonth.getMonth() + 1
      const nextAnio  = nextMonth.getFullYear()

      // Buscar póliza con datos del aliado
      const [rows] = await pool.execute<any[]>(
        `SELECT p.*, a.nombre as aliado_nombre, a.correo as aliado_correo,
                l.placa
         FROM polizas p
         JOIN aliados a ON a.id = p.aliado_id
         LEFT JOIN leads l ON l.id = p.lead_id
         WHERE p.id = ?`,
        [req.params.id]
      )
      if (!rows.length) { res.status(404).json({ status:'error', message:'Póliza no encontrada' }); return }
      const pol = rows[0]

      await pool.execute(
        `UPDATE polizas SET estado=?,
         observaciones=COALESCE(?,observaciones),
         mes = CASE WHEN ?='aprobada' THEN ? ELSE mes END,
         anio = CASE WHEN ?='aprobada' THEN ? ELSE anio END,
         primer_pago_at=CASE WHEN ?='aprobada' THEN ? ELSE primer_pago_at END
         WHERE id=?`,
        [estado, observaciones || null, estado, nextMes, estado, nextAnio, estado, now, req.params.id]
      )

      // Email al aliado
      const polComision = parseFloat(pol.valor_comision || 0) || Math.round(parseFloat(pol.valor_prima || 0) / 1.19 * 0.06)
      if (estado === 'aprobada') {
        sendPolizaAprobadaEmail({
          to:             pol.aliado_correo,
          aliado_nombre:  pol.aliado_nombre,
          cliente_nombre: pol.cliente_nombre,
          aseguradora:    pol.aseguradora,
          valor_prima:    parseFloat(pol.valor_prima || 0),
          valor_comision: polComision,
          placa:          pol.placa || undefined,
        }).catch(() => {})
      } else if (estado === 'no_convertida' && observaciones) {
        sendPolizaNoAprobadaEmail({
          to:             pol.aliado_correo,
          aliado_nombre:  pol.aliado_nombre,
          cliente_nombre: pol.cliente_nombre,
          aseguradora:    pol.aseguradora,
          placa:          pol.placa || undefined,
          motivo:         observaciones,
        }).catch(() => {})
      }

      // Crear notificación y empujar en tiempo real al aliado
      try {
        const placaStr = pol.placa ? ` · ${pol.placa}` : ''
        let notifTipo   = ''
        let notifTitulo = ''
        let notifMsg    = ''

        if (estado === 'aprobada') {
          notifTipo   = 'poliza_aprobada'
          notifTitulo = `¡Póliza aprobada!${placaStr}`
          notifMsg    = `La póliza de ${pol.cliente_nombre} con ${pol.aseguradora}${placaStr} fue aprobada. Tu comisión es $${polComision.toLocaleString('es-CO')}.`
        } else if (estado === 'no_convertida') {
          notifTipo   = 'poliza_no_aprobada'
          notifTitulo = `Póliza no aprobada${placaStr}`
          notifMsg    = `La póliza de ${pol.cliente_nombre} con ${pol.aseguradora}${placaStr} no fue aprobada.${observaciones ? ' Motivo: ' + observaciones : ''}`
        } else if (estado === 'en_contacto') {
          notifTipo   = 'estado_actualizado'
          notifTitulo = `Estamos contactando al cliente${placaStr}`
          notifMsg    = `Tu solicitud para ${pol.cliente_nombre} con ${pol.aseguradora}${placaStr} avanza. Nuestro asesor está intentando comunicarse con el cliente.`
        } else if (estado === 'en_proceso') {
          notifTipo   = 'estado_actualizado'
          notifTitulo = `¡El cliente quiere la póliza!${placaStr}`
          notifMsg    = `El cliente de ${pol.cliente_nombre}${placaStr} está interesado en la póliza con ${pol.aseguradora}. Estamos haciendo los trámites para emitirla.`
        } else if (estado === 'poliza_emitida') {
          notifTipo   = 'estado_actualizado'
          notifTitulo = `Póliza emitida ✍️${placaStr}`
          notifMsg    = `Se emitió la póliza para ${pol.cliente_nombre} con ${pol.aseguradora}${placaStr}. Esperamos el primer pago del cliente para confirmar tu comisión.`
        }

        if (notifTipo) {
          const notifId  = randomUUID()
          const notifNow = new Date().toISOString()
          await pool.execute(
            `INSERT INTO notificaciones (id, aliado_id, tipo, titulo, mensaje) VALUES (?, ?, ?, ?, ?)`,
            [notifId, pol.aliado_id, notifTipo, notifTitulo, notifMsg]
          )
          ssePush(pol.aliado_id, 'notificacion', {
            id: notifId, tipo: notifTipo, titulo: notifTitulo,
            mensaje: notifMsg, leida: false, created_at: notifNow,
          })
        }

        // Evento de actualización de estado (para MisPolizas y Dashboard en tiempo real)
        ssePush(pol.aliado_id, 'poliza_update', {
          lead_id:        pol.lead_id || null,
          poliza_id:      req.params.id,
          estado,
          aseguradora:    pol.aseguradora,
          cliente_nombre: pol.cliente_nombre,
          valor_prima:    parseFloat(pol.valor_prima || 0),
          valor_comision: polComision,
          placa:          pol.placa || null,
          created_at:     new Date().toISOString(),
        })
      } catch { /* no interrumpir flujo principal */ }

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

// ── CLEANUP TEMPORAL — borrar después de usar ─────────────────────────────
router.delete('/cleanup-transaccional', async (_req, res, next) => {
  try {
    const tables = ['notificaciones','pago_detalles','pagos','polizas','leads','cotizaciones']
    const result: Record<string, number> = {}
    for (const t of tables) {
      try {
        const [[row]] = await pool.execute<any[]>(`SELECT COUNT(*) as n FROM ${t}`)
        await pool.execute(`DELETE FROM ${t}`)
        result[t] = Number(row.n)
      } catch { result[t] = -1 }
    }
    res.json({ status: 'success', deleted: result })
  } catch(err) { next(err) }
})

export default router
