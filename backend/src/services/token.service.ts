import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pool } from '../config/db'
import { env } from '../config/env'

export function generateAccessToken(
  id: string,
  email: string,
  tipo: 'aliado' | 'admin',
  rol?: string,
  onboarding_step?: number
): string {
  return jwt.sign(
    {
      sub: id,
      email,
      tipo,
      ...(rol !== undefined && { rol }),
      ...(onboarding_step !== undefined && { onboarding_step }),
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  )
}

export async function generateRefreshToken(
  userId: string,
  tipo: 'aliado' | 'admin' = 'aliado'
): Promise<string> {
  const token     = uuidv4() + '-' + uuidv4()
  const tokenHash = await bcrypt.hash(token, 10)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  if (tipo === 'admin') {
    await pool.execute(
      'INSERT INTO admin_refresh_tokens (admin_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, tokenHash, expiresAt]
    )
  } else {
    await pool.execute(
      'INSERT INTO refresh_tokens (aliado_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, tokenHash, expiresAt]
    )
  }

  return token
}

export async function verifyRefreshToken(
  token: string
): Promise<{ aliadoId: string; tokenId: string; tipo: 'aliado' | 'admin' } | null> {
  // Buscar en aliados
  const [aliadoRows] = await pool.execute<any[]>(
    'SELECT id, aliado_id, token_hash FROM refresh_tokens WHERE revocado = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 50'
  )
  for (const row of aliadoRows) {
    const match = await bcrypt.compare(token, row.token_hash)
    if (match) return { aliadoId: row.aliado_id, tokenId: row.id, tipo: 'aliado' }
  }

  // Buscar en admins
  const [adminRows] = await pool.execute<any[]>(
    'SELECT id, admin_id, token_hash FROM admin_refresh_tokens WHERE revocado = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 50'
  )
  for (const row of adminRows) {
    const match = await bcrypt.compare(token, row.token_hash)
    if (match) return { aliadoId: row.admin_id, tokenId: row.id, tipo: 'admin' }
  }

  return null
}

export async function revokeRefreshToken(tokenId: string, tipo: 'aliado' | 'admin' = 'aliado'): Promise<void> {
  const table = tipo === 'admin' ? 'admin_refresh_tokens' : 'refresh_tokens'
  await pool.execute(`UPDATE ${table} SET revocado = TRUE WHERE id = ?`, [tokenId])
}

export async function revokeAllRefreshTokens(userId: string, tipo: 'aliado' | 'admin' = 'aliado'): Promise<void> {
  if (tipo === 'admin') {
    await pool.execute('UPDATE admin_refresh_tokens SET revocado = TRUE WHERE admin_id = ?', [userId])
  } else {
    await pool.execute('UPDATE refresh_tokens SET revocado = TRUE WHERE aliado_id = ?', [userId])
  }
}
