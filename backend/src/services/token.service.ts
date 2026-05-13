import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pool } from '../config/db'
import { env } from '../config/env'

export function generateAccessToken(
  id: string,
  email: string,
  tipo: 'aliado' | 'admin',
  rol?: string
): string {
  return jwt.sign(
    { sub: id, email, tipo, ...(rol && { rol }) },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  )
}

export async function generateRefreshToken(aliadoId: string): Promise<string> {
  const token      = uuidv4() + '-' + uuidv4()
  const tokenHash  = await bcrypt.hash(token, 10)
  const expiresAt  = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await pool.execute(
    'INSERT INTO refresh_tokens (aliado_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [aliadoId, tokenHash, expiresAt]
  )

  return token
}

export async function verifyRefreshToken(
  token: string
): Promise<{ aliadoId: string; tokenId: string } | null> {
  const [rows] = await pool.execute<any[]>(
    `SELECT id, aliado_id, token_hash
     FROM refresh_tokens
     WHERE revocado = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 50`
  )

  for (const row of rows) {
    const match = await bcrypt.compare(token, row.token_hash)
    if (match) return { aliadoId: row.aliado_id, tokenId: row.id }
  }

  return null
}

export async function revokeRefreshToken(tokenId: string): Promise<void> {
  await pool.execute('UPDATE refresh_tokens SET revocado = TRUE WHERE id = ?', [tokenId])
}

export async function revokeAllRefreshTokens(aliadoId: string): Promise<void> {
  await pool.execute(
    'UPDATE refresh_tokens SET revocado = TRUE WHERE aliado_id = ?',
    [aliadoId]
  )
}
