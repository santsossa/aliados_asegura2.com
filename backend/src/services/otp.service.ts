import bcrypt from 'bcryptjs'
import { pool } from '../config/db'
import { env } from '../config/env'

/** Genera un OTP de 6 dígitos, lo guarda hasheado y devuelve el código en claro */
export async function generateOTP(aliadoId: string): Promise<string> {
  // Invalida OTPs anteriores del mismo usuario
  await pool.execute(
    'UPDATE otp_tokens SET usado = TRUE WHERE aliado_id = ? AND usado = FALSE',
    [aliadoId]
  )

  const otp        = Math.floor(100000 + Math.random() * 900000).toString()
  const otpHash    = await bcrypt.hash(otp, 10)
  const expiresAt  = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(env.OTP_EXPIRES_MINUTES))

  await pool.execute(
    'INSERT INTO otp_tokens (aliado_id, otp_hash, expires_at) VALUES (?, ?, ?)',
    [aliadoId, otpHash, expiresAt]
  )

  return otp
}

/** OTP para admins */
export async function generateAdminOTP(adminId: string): Promise<string> {
  await pool.execute('UPDATE admin_otp_tokens SET usado = TRUE WHERE admin_id = ? AND usado = FALSE', [adminId])
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const otpHash = await bcrypt.hash(otp, 10)
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(env.OTP_EXPIRES_MINUTES))
  await pool.execute('INSERT INTO admin_otp_tokens (admin_id, otp_hash, expires_at) VALUES (?, ?, ?)', [adminId, otpHash, expiresAt])
  return otp
}

export async function verifyAdminOTP(adminId: string, otp: string): Promise<boolean> {
  const [rows] = await pool.execute<any[]>(
    'SELECT id, otp_hash FROM admin_otp_tokens WHERE admin_id = ? AND usado = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
    [adminId]
  )
  if (!rows.length) return false
  const match = await bcrypt.compare(otp, rows[0].otp_hash)
  if (!match) return false
  await pool.execute('UPDATE admin_otp_tokens SET usado = TRUE WHERE id = ?', [rows[0].id])
  return true
}

/** Verifica el OTP. Devuelve true si es válido y lo marca como usado */
export async function verifyOTP(aliadoId: string, otp: string): Promise<boolean> {
  const [rows] = await pool.execute<any[]>(
    `SELECT id, otp_hash
     FROM otp_tokens
     WHERE aliado_id = ? AND usado = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [aliadoId]
  )

  if (!rows.length) return false

  const match = await bcrypt.compare(otp, rows[0].otp_hash)
  if (!match) return false

  await pool.execute('UPDATE otp_tokens SET usado = TRUE WHERE id = ?', [rows[0].id])
  return true
}
