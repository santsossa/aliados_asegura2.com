import { Request, Response, NextFunction } from 'express'
import { pool } from '../config/db'
import { generateAccessToken } from '../services/token.service'

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/aliados/onboarding/personal
// body: { nombre, apellido, cedula, telefono }
// ─────────────────────────────────────────────────────────────────────────────
export async function personal(req: Request, res: Response, next: NextFunction) {
  try {
    const aliadoId = req.aliado!.sub
    const { nombre, apellido, cedula, telefono } = req.body

    // Verificar que la cédula no esté usada por otro aliado
    const [dup] = await pool.execute<any[]>(
      'SELECT id FROM aliados WHERE cedula = ? AND id != ?',
      [cedula, aliadoId]
    )
    if (dup.length) {
      res.status(409).json({ status: 'error', message: 'La cédula ya está registrada por otro usuario.' })
      return
    }

    await pool.execute(
      'UPDATE aliados SET nombre = ?, apellido = ?, cedula = ?, telefono = ?, onboarding_step = 1 WHERE id = ?',
      [nombre, apellido, cedula, telefono, aliadoId]
    )

    const [rows] = await pool.execute<any[]>('SELECT correo FROM aliados WHERE id = ?', [aliadoId])
    const accessToken = generateAccessToken(aliadoId, rows[0].correo, 'aliado', undefined, 1)

    res.json({ status: 'success', accessToken, onboarding_step: 1 })
  } catch (err) { next(err) }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/aliados/onboarding/banco
// body: { banco, tipo_cuenta, numero_cuenta, titular }
// ─────────────────────────────────────────────────────────────────────────────
export async function banco(req: Request, res: Response, next: NextFunction) {
  try {
    const aliadoId = req.aliado!.sub
    const { banco: bancoNombre, tipo_cuenta, numero_cuenta, titular } = req.body

    // UPSERT en aliado_banco
    const [existing] = await pool.execute<any[]>(
      'SELECT id FROM aliado_banco WHERE aliado_id = ?',
      [aliadoId]
    )

    if (existing.length) {
      await pool.execute(
        'UPDATE aliado_banco SET banco = ?, tipo_cuenta = ?, numero_cuenta = ?, titular = ? WHERE aliado_id = ?',
        [bancoNombre, tipo_cuenta, numero_cuenta, titular, aliadoId]
      )
    } else {
      await pool.execute(
        'INSERT INTO aliado_banco (aliado_id, banco, tipo_cuenta, numero_cuenta, titular) VALUES (?, ?, ?, ?, ?)',
        [aliadoId, bancoNombre, tipo_cuenta, numero_cuenta, titular]
      )
    }

    await pool.execute(
      'UPDATE aliados SET onboarding_step = 2 WHERE id = ?',
      [aliadoId]
    )

    const [rows] = await pool.execute<any[]>('SELECT correo FROM aliados WHERE id = ?', [aliadoId])
    const accessToken = generateAccessToken(aliadoId, rows[0].correo, 'aliado', undefined, 2)

    res.json({ status: 'success', accessToken, onboarding_step: 2 })
  } catch (err) { next(err) }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/aliados/onboarding/tipo
// body: { tipo_aliado, ciudad }
// ─────────────────────────────────────────────────────────────────────────────
export async function tipo(req: Request, res: Response, next: NextFunction) {
  try {
    const aliadoId = req.aliado!.sub
    const { tipo_aliado, ciudad } = req.body

    await pool.execute(
      "UPDATE aliados SET tipo_aliado = ?, ciudad = ?, onboarding_step = 3, estado = 'activo' WHERE id = ?",
      [tipo_aliado, ciudad, aliadoId]
    )

    const [rows] = await pool.execute<any[]>('SELECT correo FROM aliados WHERE id = ?', [aliadoId])
    const accessToken = generateAccessToken(aliadoId, rows[0].correo, 'aliado', undefined, 3)

    res.json({ status: 'success', accessToken, onboarding_step: 3 })
  } catch (err) { next(err) }
}
